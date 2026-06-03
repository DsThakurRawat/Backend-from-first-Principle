from elasticsearch import Elasticsearch, helpers
import csv

es = Elasticsearch(
    cloud_id="YOUR_CLOUD_ID",
    api_key="YOUR_API_KEY"
)

INDEX = "reviews"

# 1. Create index with explicit mapping
if es.indices.exists(index=INDEX):
    es.indices.delete(index=INDEX)

es.indices.create(index=INDEX, body={
    "mappings": {
        "properties": {
            "review":    {"type": "text"},     # analysed full-text
            "sentiment": {"type": "keyword"}  # exact: "positive" / "negative"
        }
    }
})

# 2. Bulk insert from CSV
def generate_docs(path: str):
    with open(path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("review") and row.get("sentiment"):
                yield {
                    "_index": INDEX,
                    "_source": {
                        "review":    row["review"],
                        "sentiment": row["sentiment"]
                    }
                }

success, errors = helpers.bulk(es, generate_docs("reviews.csv"))
print(f"Inserted {success} documents, {len(errors)} errors")
