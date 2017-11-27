
Overview:

The react SSR plugin renderer provides the `Render Cache` features.

_create with [ascii flow](http://asciiflow.com/)_
```
      +------------------------------------------------+     +------------------+
      |                   Web Server                   |     |     API Server   |
      |                                                |     |                  |
      |  +--------------------+ +--------------------+ |     | +--------------+ |
      |  |                    | |                    | |     | |              | |
      |  |                    | |                    | |     | |              | |
      |  |                    | |                    | |     | |   API Cache  | |
      |  |    Data Cache      | |    Render Cache    | |     | |              | |
      |  |                    | |                    | |     | |              | |
      |  |                    | |                    | |     | |              | |
      |  |                    | |                    | |     | |              | |
      |  +----------+---------+ +----------+---------+ |     | +------+-------+ |
      |             |                      |           |     |        |         |
      |             |                      |           |     |        |         |
      |  +----------+----------------------+--------+  |     | +------+-------+ |
      |  |                                          |  |     | |              | |
Request  |           Node.js React App              |  |     | |     API      | |
+-----+-->                                          +---------->              | |
      |  |                                          |  |     | |              | |
      |  +------------------------------------------+  |     | +--------------+ |
      +------------------------------------------------+     +------------------+

```

NOTE: If the `DataCache` or the `RenderCache` fail or are not available, do **not render on the server**. When the
      cache is unavailable only perform client-side rendering. This will prevent server overload when cache is not
      available. 
      In this scenario, the client apps will request data from the API Server (and completely bypass the web 
      server cache). As such, the lack of web server cache should not negatively impact client application performance
      so long as the API Cache is available.


Sequence Diagram - App Overview:
_created with [Ascii Sequence Diagram Creator](http://textart.io/sequence)_

```
          +-----+                    +-----------+ +-------------+ +-----+                    +-----------+ +---------+
          | App |                    | DataCache | | RenderCache | | Api |                    | ApiCache  | | Backend |
          +-----+                    +-----------+ +-------------+ +-----+                    +-----------+ +---------+
 ----------\ |                             |              |           |                             |            |
 | Request |-|                             |              |           |                             |            |
 |---------| |                             |              |           |                             |            |
             |                             |              |           |                             |            |
             | getData(params)             |              |           |                             |            |
             |---------------------------->|              |           |                             |            |
             |                             |              |           |                             |            |
             |                  [no cache] |              |           |                             |            |
             |<----------------------------|              |           |                             |            |
             |                             |              |           |                             |            |
             | loadData(params)            |              |           |                             |            |
             |------------------------------------------------------->|                             |            |
             |                             |              |           |                             |            |
             |                             |              |           | getData(params)             |            |
             |                             |              |           |---------------------------->|            |
             |                             |              |           |                             |            |
             |                             |              |           |                  [no cache] |            |
             |                             |              |           |<----------------------------|            |
             |                             |              |           |                             |            |
             |                             |              |           | loadData(params)            |            |
             |                             |              |           |----------------------------------------->|
             |                             |              |           |                             |            |
             |                             |              |           |                             |       data |
             |                             |              |           |<-----------------------------------------|
             |                             |              |           |                             |            |
             |                             |              |           | setData(params, data)       |            |
             |                             |              |           |---------------------------->|            |
             |                             |              |           |                             |            |
             |                             |              |      data |                             |            |
             |<-------------------------------------------------------|                             |            |
             |                             |              |           |                             |            |
             | getTemplates                |              |           |                             |            |
             |------------------------------------------->|           |                             |            |
             |                             |              |           |                             |            |
             |                             |    templates |           |                             |            |
             |<-------------------------------------------|           |                             |            |
             |                             |              |           |                             |            |
             | render                      |              |           |                             |            |
             |-------                      |              |           |                             |            |
             |      |                      |              |           |                             |            |
             |<------                      |              |           |                             |            |
             |                             |              |           |                             |            |
             | setData(params, data)       |              |           |                             |            |
             |---------------------------->|              |           |                             |            |
             |                             |              |           |                             |            |
             | setTemplates(params, templates)            |           |                             |            |
             |------------------------------------------->|           |                             |            |
-----------\ |                             |              |           |                             |            |
| Response |-|                             |              |           |                             |            |
|----------| |                             |              |           |                             |            |
             |                             |              |           |                             |            |
```
