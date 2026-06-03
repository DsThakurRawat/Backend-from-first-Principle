// Using confluent-kafka-go (librdkafka). kafka-go (segmentio) is a pure-Go alternative.
p, _ := kafka.NewProducer(&kafka.ConfigMap{
    "bootstrap.servers": "localhost:9092",
    "acks":              "all",   // durability: leader + in-sync replicas (§5)
    "enable.idempotence": true,   // no duplicates on producer retry (§9)
    "linger.ms":         5,       // wait up to 5ms to batch records (throughput)
    "compression.type":  "zstd",
})
defer p.Close()

topic := "orders"
// The KEY decides the partition → all events for one order stay ordered (§4, §10).
err := p.Produce(&kafka.Message{
    TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
    Key:            []byte("order-42"),
    Value:          []byte(`{"event":"placed","amount":1999}`),
}, nil)
if err != nil { log.Fatal(err) }

// Producing is async + batched; Flush blocks until queued messages are delivered.
p.Flush(5000)

// Delivery reports tell you the final partition/offset (or an error) per message:
//   for e := range p.Events() { if m, ok := e.(*kafka.Message); ok { ... } }