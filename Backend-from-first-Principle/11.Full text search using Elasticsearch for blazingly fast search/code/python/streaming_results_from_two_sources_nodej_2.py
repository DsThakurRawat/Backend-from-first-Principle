def search_reviews(query: str, sentiment_filter: str = None) -> list:
    must_clauses = [{
        "multi_match": {
            "query":     query.lower(),
            "fields":   ["review"],
            "fuzziness": "AUTO",
            "operator":  "and"   # all terms must appear
        }
    }]

    filter_clauses = []
    if sentiment_filter:
        filter_clauses.append({
            "term": {"sentiment": sentiment_filter}
        })

    body = {
        "query": {"bool": {"must": must_clauses, "filter": filter_clauses}},
        "size": 20
    }

    resp = es.search(index=INDEX, body=body)
    return [
        {"score": hit["_score"], **hit["_source"]}
        for hit in resp["hits"]["hits"]
    ]

# Usage
results = search_reviews("gret product", sentiment_filter="positive")
# "gret" (typo for "great") matched via fuzziness=AUTO (edit distance 1)
