---
title: 'Canada Drug Product Database API'
date: 2025-08-11T00:00:00-07:00
tags: []
author: 'Hubert Lin'
draft: false
hidemeta: false
comments: true
description: ''
cover:
  image: ''
---

A few months ago (summer 2025) I was looking for my next project. A friend of a friend of mine introduced me to a local pharmacist and entrepreneur. We started working together to build out a potential software product, worked on it for a few months and stopped. Although we deemed the project not viable, we still learned a lot through the process I was able to build something pretty cool. That's when I was introduced to the Canadian Drug Product Database (DPD).

The [Drug Product Database](https://health-products.canada.ca/api/documentation/dpd-documentation-en.html#a1) is a list of all the drugs that Health Canada manages, which is over 47,000 products. They also offer a free API which you can call to lookup drugs.


### The problem

As part of our MVP, we needed a way to input drug data, but access to the DPD through the API was really slow. Much too slow for a type-ahead, combobox input field. We needed something that could return data within seconds.

### The solution

Thankfully, Health Canada offers the data as an extract file. So, I took the data and loaded it into our PostgreSQL database. From there I was able to build a debounced input component to search for and select the drugs.

<video controls src="./demo_drug_lookup_component.mp4"></video>


## Technical Stuff

Now let's talk more about the technical. First let's try to use the API hosted by Health Canada to find `Ozempic`.

[https://health-products.canada.ca/api/drug/drugproduct?brandname=Ozempic](https://health-products.canada.ca/api/drug/drugproduct?brandname=Ozempic)

Notice how long it takes you to load that page, and we want to be good citizens and not overuse their API infrastructure. So let's host, and serve the data ourselves.

### Getting the extract files

The extract files can be found [here](https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database/what-data-extract-drug-product-database.html).
They are updated every month or so, but you can sign up for their mailing list to get notified when things change.


### Defining the schema

I used Drizzle as an ORM so here's how to define the schema to match the data extract. Also exporting the `select` type below for convenience.
After you define the schema, make sure to add it to your drizzle config.

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import { date, text } from "drizzle-orm/pg-core";

/**
 * https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/drug-product-database/read-file-drug-product-database-data-extract.html
 */
export const drugProduct = pgTable("drug_product", {
  drugCode: text("drug_code").notNull(),
  productCategorization: text("product_categorization"),
  class: text("class"),
  drugIdentificationNumber: text("drug_identification_number"),
  brandName: text("brand_name"),
  descriptor: text("descriptor"),
  pediatricFlag: text("pediatric_flag"),
  accessionNumber: text("accession_number"),
  numberOfAis: text("number_of_ais"),
  lastUpdateDate: date("last_update_date"),
  aiGroupNo: text("ai_group_no"),
  classFFootnote: text("class_ffootnote"),
  brandNameFFootnote: text("brand_name_ffootnote"),
  descriptorFFootnote: text("descriptor_ffootnote"),
});

export type DrugProductSelect = typeof drugProduct.$inferSelect;
```

### API design considerations

Next to build the API, I created a `GET` endpoint to query the DB. Accepting both a brand name `query` and a `din`. I deliberately separated these two query parameters on the API side and expect the front-end to pick the right one. This was done to prevent the backend having to determine whether the query is a DIN or query, and also makes the API easier to understand from someone reading just the backend.

- ensure results are have a max limit to prevent slow queries
- ensure auth middleware to prevent anonymous access
- ensure rateLimiter to prevent abuse of the endpoint

This example uses Tanstack Start, at the time of writing it's in Beta, so this syntax may change.

```typescript
export const lookupDrugFn = createServerFn({ method: "GET" })
  .middleware([db, auth, rateLimiter])
  .validator((data: LookupDrugRequest) => data)
  .handler(async ({ context, data }) => {
    const { db } = context;
    const { query, din } = data;

    if (din) {
      return await db.query.drugProduct.findMany({
        where: (drug, { and, like, notInArray }) =>
          and(
            like(drug.drugIdentificationNumber, `%${din}%`),
            notInArray(drug.drugIdentificationNumber, data.exclude || []),
          ),
        limit: 10,
      });
    }

    return await db.query.drugProduct.findMany({
      where: (drug, { and, ilike, notInArray }) =>
        and(
          ilike(drug.brandName, `%${query}%`),
          notInArray(drug.drugIdentificationNumber, data.exclude || []),
        ),
      limit: 10,
    });
  });
```

### Frontend Component Design considerations

When the user interacts with this input, it's crucial to have immediate feedback when the loading begins so that they are not left questioning what is going on.

At the same time, we need add debounce to the input to ensure we don't spam the API with unnecessary requests. 

Finally, we have to make sure the results are cached so that we can make use of the results we've already received previously.

I've removed all the Tailwind classes for your reading convenience.

```tsx
export function useLookupDrug(query?: string, exclude?: string[]) {
  const lookupDrug = useServerFn(lookupDrugFn);
  const queryType = !query
    ? undefined
    : isNumber(query)
    ? "din" as const
    : "name" as const;
  const [debouncedQuery] = useDebouncedValue(query, { wait: 700 });

  const drugs = useQuery({
    queryKey: ["lookup_drug", debouncedQuery],
    enabled: !!debouncedQuery,
    queryFn: async () => {
      if (!debouncedQuery) {
        return [];
      }

      const query = isNumber(debouncedQuery)
        ? { din: debouncedQuery, exclude }
        : { query: debouncedQuery, exclude };

      const result = await lookupDrug({ data: query });
      return result satisfies DrugProductSelect[];
    },
  });

  return { drugs, queryType };
}



export function DrugLookupInput(props: Props) {
  const [query, setQuery] = useState("");
  const { drugs } = useLookupDrug(query, props.value);

  const addDrug = (drugId: string) => {
    const selected = props.value || [];
    if (selected.includes(drugId)) {
      props.onChange?.(selected.filter((id) => id !== drugId));
    } else {
      props.onChange?.([...selected, drugId]);
    }
    setQuery("");
  };

  const removeDrug = (drugId: string) => {
    const selected = props.value || [];
    props.onChange?.(selected.filter((id) => id !== drugId));
  };

  return (
    <>
      <div>
        {props.value?.map((din) => (
          <div key={din}>
            <span>{din}</span>
            <Button onClick={() => removeDrug(din)}>
              <XIcon />
            </Button>
          </div>
        ))}
      </div>

      <Headless.Combobox
        multiple={false}
        onChange={(value: string) => value ? addDrug(value) : undefined}
        onClose={() => setQuery("")}
      >
        <span data-slot="control">
          <Headless.ComboboxButton>
            <SearchIcon />
          </Headless.ComboboxButton>

          <Headless.ComboboxInput
            type="text"
            autoFocus={true}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-slot="control"
            placeholder="Search drug by Brand or DIN"
          />
        </span>

        <Headless.ComboboxOptions transition anchor="bottom">
          {drugs.data?.length === 0 && (
            <div>
              No results for "{query}"
            </div>
          )}
          {drugs.data?.map((drug) => (
            <Headless.ComboboxOption
              key={drug.drugIdentificationNumber}
              value={drug.drugIdentificationNumber}
            >
              <div>{drug.brandName} ({drug.drugIdentificationNumber})</div>
              <div>
                {drug.descriptor?.toLowerCase()}
              </div>
            </Headless.ComboboxOption>
          ))}
        </Headless.ComboboxOptions>
      </Headless.Combobox>
    </>
  );
}
```

## Conclusion

It's pretty fun to try to make slow things faster and also improve the user experience. If you ever need Canada Drug Product Data, let me know and I'd be happy to build out a system to automate it for you.