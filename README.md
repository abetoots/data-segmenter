# About

`data-segmenter` is a tool that allows package consumers to define segments from their data regardless of data source like MongoDB or SQL in the backend and provide those segments to a client consumer or user in the frontend.

[Demo](https://data-segmenter-demo-6ql3nxgpb-abetoots.vercel.app/)

This package has 3 main APIs:

## 1. Segment Builder API

Allows you to define your segments and their corresponding query builders. A segment should be represented by a query e.g. "I want the segment of my profiles with a `{field}` containing `{value}`" could be represented as a MongoDb or SQL query returned by your `buildQuery` methods.

You would consume this in your backend.

## 2. Segment Composer API

Allow for the composition and manipulation of segments.

You would consume this in your client. It should not know anything of your implementation of the Definition API.

This API should provide only a representation of composed segments without being coupled with the backend implementation.

## 3. Query Composer API

Parses the composed segments from the Composer, and builds composed queries from it. Implementation is done by consumer.

You would consume this in the backend.

### How to use:

See `examples` folder.
