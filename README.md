### About
This project is a monorepo for a simple kanban application.  The application itself is written as a traditional client/server project, with the server in the `./server` directory and the client in the `./kanban-app` directory.  The server is a node.js Express server, while the client is a React webapp.

It has been wrapped in an Electron app as well for standalone usage on Windows, macOS, and Linux, bundled with electron-builder.

The entire project was written for portfolio purposes, but I do use it for all of my own projects both personal and professional.

I wrote the server and client entirely myself, and used the client as an opportunity to dip my toes into Redux.

The electron app was produced almost entirely by GitHub CoPilot, utilizing Claude Sonnet 4.  This was my first foray into using an LLM for development tasks, and it's certainly been an experience.  The code it produced seems mostly sane but it took a few days to get here thanks to the iterative prompting required.  It was very much like working with a junior dev, offering instructions and doing some code review.

I think it would have taken me longer to learn Electron myself, specifically electron-builder, than it took to use the AI.  Over the course of about three days I tried three different LLMs in Copilot (GPT, Sonnet 3.5, and Sonnet 4) and two different builders (electron-forge and electron-builder).

Including the node.js Express server was a challenge thanks to the widespread use of native modules such as `better-sqlite3`, as well as dynamic node.js requires like `fs`.

This entire project is released under the terms of the 0BSD license, availble in the LICENSE file.

### Running the client/server
Currently there are no artifacts or packages for this, but I intend to change that soon.  Until then, simply get a copy of the source through your favorite method, be that cloning, downloading the archive, or doing a checkout, and build the client and server by running `npm run build` in the `server` directory.  This will build the React webapp, copy it into the server directory, and build the server.  From here you can run the server in dev or prod mode as you like, with `npm run dev` or `npm run run` -- I know this last one is a bit weird, I'll change it.

Overrides for things like port, bucket names, and CORS origins can be set in a `.env` file.  Look in `server/src/consts.mjs` for all of the available vars, there aren't many.

Buckets are created upon creation of a new project within the app; changing this setting does not affect existing projects or their buckets.

On first run, the console will output a randomly generated password for the `admin` user.

#### Known issues
This is a work in progress.  At present the standalone version works well for a single user.  The multi-user client/server version is not yet feature complete.  Users can be created, deleted, and updated by an administrator and individual users can manage and use their own boards, but collaboration features are a work in progress.

### Running the standalone version
Just poke your head into the releases on the right of the project homepage and download whichever is appropriate for your environment.  There are multiple formats available, targeting macOS, Windows, and Linux.  Only the Windows installer and Linux `.deb` releases are tested by me at present, but all of them should work.

### Contributing
I'm open to feature requests and bug reports, but not to pull requests at present; this project is primarily a portfolio project for me and as such it would be dishonest for me to include contributions from others.  By all means, make suggestions, but no PRs please, at least for the time being.
