## _Tender owner logged_ in -> create a tender (include tender details) -> upload the tender files to tender -> publish the tender

## Contractor logged in -> view all tenders -> apply on tender -> he can chat with a ai agent to ask him about anything in the tender before applying -> applying proccess takes some data from the contractor -> the ai agent + rag is processing this data to compare between all applied contractors -> and at the end the tender owner recive the ai agent results and if there's any needed human action that ai can't validate it by himself or he is not 100% sure, it's forwarded directly th the tender ownrer to take action -> and finally it's the end of proccess.

# Tenders

### api/v1/tender [POST]

- body for addint a new tender

```{

  "title": "Road Construction",
  "description": "Build new road",
  "budget": 1000000,
  "deadline_at": "2026-07-01T00:00:00Z",
  "status": "OPEN",
  "files": [
    {
      "file_url": "https://example.com/spec.pdf",
      "file_type": "PDF"
    }
  ],
  "evaluation_rules": [
    {
      "rule_name": "Experience",
      "rule_value": "30"
    },
    {
      "rule_name": "Price",
      "rule_value": "70"
    }
  ]
}
```

### api/v1/tender [GET]
