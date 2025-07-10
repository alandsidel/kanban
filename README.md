This project is a monorepo for a simple kanban application.  The application itself is written as a traditional client/server project, with the server in the `./server` directory and the client in the `./kanban-app` directory.  The server is a node.js Express server, while the client is a React webapp.

It has been wrapped in an Electron app as well for standalone usage on Windows, macOS, and Linux, bundled with electron-builder.

The entire project was written for portfolio purposes, but I do use it for all of my own projects both personal and professional.

I wrote the server and client entirely myself, and used the client as an opportunity to dip my toes into Redux.

The electron app was produced almost entirely by GitHub CoPilot, utilizing Claude Sonnet 4.  This was my first foray into using an LLM for development tasks, and it's certainly been an experience.  The code it produced seems mostly sane but it took a few days to get here thanks to the iterative prompting required.  It was very much like working with a junior dev, offering instructions and doing some code review.

I think it would have taken me longer to learn Electron myself, specifically electron-builder, than it took to use the AI.  Over the course of about three days I tried three different LLMs in Copilot (GPT, Sonnet 3.5, and Sonnet 4) and two different builders (electron-forge and electron-builder).

Including the node.js Express server was a challenge thanks to the widespread use of native modules such as `better-sqlite3`, as well as dynamic node.js requires like `fs`.

This entire project is released under the terms of the MIT license, availble in the LICENSE file.
