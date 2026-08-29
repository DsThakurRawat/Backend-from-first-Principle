# Using confluent-kafka (librdkafka). kafka-python / aiokafka are alternatives.
from confluent_kafka import Producer

p = Producer({
    "bootstrap.servers": "localhost:9092",
    "acks": "all",                 # durability: leader + in-sync replicas (sec 5)
    "enable.idempotence": True,    # no duplicates on producer retry (sec 9)
    "linger.ms": 5,                # batch window for throughput
    "compression.type": "zstd",
})

def on_delivery(err, msg):         # async callback: final partition/offset or error
    if err:
        print("delivery failed:", err)
    else:
        print(f"delivered to {msg.topic()}[{msg.partition()}]@{msg.offset()}")

# The KEY decides the partition -> all events for one order stay ordered (sec 4, sec 10).
p.produce(
    "orders",
    key=b"order-42",
    value=b'{"event":"placed","amount":1999}',
    on_delivery=on_delivery,
)
p.flush()                          # block until queued messages are delivered
