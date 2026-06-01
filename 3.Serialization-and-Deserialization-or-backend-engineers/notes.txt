Detailed notes on *7. Serialization and Deserialization for backend engineers*

### *1. The Core Problem: Language Barriers in Networking*
*   *Different Environments:* A typical web application consists of a client (like a frontend built with JavaScript) and a server (a backend built with a language like Rust). 
*   *Incompatible Data Types:* These languages handle data very differently. For instance, JavaScript is highly dynamic and not compiled, whereas Rust is compiled and has extremely strict data types. 
*   *The Challenge:* When a JavaScript client sends an internal data object over the internet to a Rust server, the Rust server cannot natively understand or parse JavaScript data structures. To communicate effectively over the network, they need a universal language.

### *2. What is Serialization and Deserialization?*
*   *The Solution:* Both the client and the server agree on a single, common standard format for transmitting data.
*   *Serialization:* The process of converting native data (like a JavaScript object or a Rust struct) into this common, standard format before sending it over the network.
*   *Deserialization:* The exact reverse process. When a machine receives the standard format, it parses and converts it back into its own native data type so it can perform business logic.
*   *Purpose:* This makes data transmission completely *language-agnostic* and **domain-agnostic**, meaning any machine can talk to any other machine regardless of the underlying technologies they use.

### *3. Types of Serialization Standards*
There are many formats used for serialization, which generally fall into two categories:
1.  *Text-Based Formats:* These are human-readable. Examples include JSON, YAML, and XML. 
2.  *Binary Formats:* These are compiled into raw binary for highly efficient, compact transmission. Examples include Protobuf and Avro. 

### *4. Deep Dive into JSON (The Industry Standard)*
For traditional HTTP REST API communication, *JSON (JavaScript Object Notation)* is the most popular serialization standard, used roughly 80% of the time. 
*   *Use Cases:* Beyond HTTP transmission, JSON is heavily used for application logging and configuration files. 
*   *Characteristics:* Despite its name, it is not limited to JavaScript and is heavily praised for being entirely human-readable. 
*   *Strict Syntax Rules:*
    *   A JSON object must start with an opening curly brace `{` and end with a closing curly brace `}`.
    *   *Keys:* All keys must be strings and must be wrapped in double quotes (e.g., `"name":`).
    *   *Values:* Values are limited to fundamental data types: strings, numbers, booleans, arrays, or nested JSON objects.

### *5. The Backend Engineer's Mental Model (OSI Layers)*
When data travels over the internet, it passes through many complex network layers (the OSI model).
*   *The Abstraction:* As a backend engineer, you only need to focus on the **Application Layer**. You can safely assume that your client serializes data into JSON and sends it off.
*   *The Intermediary Steps:* Under the hood, the network converts that JSON into data frames, IP packets, and eventually physical bits (`0`s and `1`s) transmitted via electrical or optical signals. 
*   *The Receiving End:* Before your server ever touches the incoming data, the network reassembles those `0`s and `1`s back into the exact JSON text format the client sent. You do not have to worry about the intermediate network conversions; you only deal with the JSON.

### *6. The Complete End-to-End Workflow*
Here is the step-by-step flow of how this works in a real-world scenario:
1.  *Client Prepares Data:* The frontend JavaScript app gathers user input.
2.  *Serialization (Client):* The client converts its internal data into a JSON string and attaches it to the HTTP request body.
3.  *Transmission:* The data is broken down into bits, travels across the internet, and reaches the backend server.
4.  *Deserialization (Server):* The server receives the JSON string and parses it into its own native language format (e.g., a Rust struct).
5.  *Processing:* The server executes its business logic (like saving data to a database).
6.  *Serialization (Server):* The server packages its response, converts it back into JSON format, and sends the HTTP response over the internet.
7.  *Deserialization (Client):* The frontend receives the JSON response, converts it back into a JavaScript object, and uses it to update the user interface.

