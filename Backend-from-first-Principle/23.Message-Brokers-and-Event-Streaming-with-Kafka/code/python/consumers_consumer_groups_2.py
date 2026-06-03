from confluent_kafka import Consumer

c = Consumer({
    "bootstrap.servers": "localhost:9092",
    "group.id": "billing",                 # the consumer GROUP — scale by adding instances
    "auto.offset.reset": "earliest",       # where to start if no committed offset (§8)
    "enable.auto.commit": False,           # commit manually for at-least-once (§9)
})
c.subscribe(["orders"])                    # Kafka assigns this instance some partitions

try:
    while True:
        msg = c.poll(1.0)                  # wait up to 1s for the next record
        if msg is None:
            continue
        if msg.error():
            print("error:", msg.error()); continue

        process(msg.value())               # do the work FIRST...
        c.commit(msg)                      # ...THEN commit the offset (at-least-once, §9)
finally:
    c.close()                              # leave the group cleanly → triggers a rebalance
