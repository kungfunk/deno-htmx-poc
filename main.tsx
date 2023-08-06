/** @jsx jsx */
import { Hono } from 'https://deno.land/x/hono@v3.3.4/mod.ts';
import { jsx, html, serveStatic } from 'https://deno.land/x/hono@v3.3.4/middleware.ts';
import { format } from "https://deno.land/std@0.197.0/datetime/format.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";

function InitDatabase() {
  const db = new DB("database.db");
  db.execute("CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, sessionId TEXT, name TEXT, is_closed INTEGER, date TEXT)");
  db.close();
}

function getTasks(sessionId: string): Task[] {
  const db = new DB("database.db");
  const results = db.query<[string, string, string, boolean, string]>("SELECT * FROM tasks WHERE sessionId = ?", [sessionId]);
  const tasks = results.map(([id, sessionId, name, is_closed, date]) => ({ id, sessionId, name, is_closed, date }));
  db.close();
  return tasks;
}

function addTask(sessionId: string, name: string) {
  const db = new DB("database.db");
  const id = crypto.randomUUID();
  const is_closed = false;
  const date = format(new Date(), "yyyy-MM-dd hh:mm:ss.SSS");
  const data = [id, sessionId, name, is_closed, date];
  db.query("INSERT INTO tasks (id, sessionId, name, is_closed, date) VALUES (?, ?, ?, ?, ?)", data);
  db.close();
}

const deleteTask = (id: string) => {
  const db = new DB("database.db");
  db.query("DELETE FROM tasks WHERE id = ?", [id]);
  db.close();
}

const changeTaskStatus = (id: string, is_closed: boolean) => {
  const db = new DB("database.db");
  db.query("UPDATE tasks SET is_closed = ? WHERE id = ?", [is_closed, id]);
  db.close();
}

InitDatabase();
const app = new Hono();

interface Task {
  id: string;
  sessionId: string;
  is_closed: boolean;
  name: string;
  date: string;
}

const Layout = ({ children }: { children: any }) => html`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="/static/styles.css">
    <script src="https://unpkg.com/htmx.org@1.9.4"></script>
    <title>Task manager</title>
  </head>
  <body>
      ${children}
  </body>
</html>
`;

const TaskList = ({ sessionId }: { sessionId: string }) => {
  const tasks = getTasks(sessionId);
  console.log(tasks);
  if (tasks.length === 0) return (<p id="tasklist" class="tasklist__empty">Empty bucket, good for you!</p>);
  return (
    <ul class="tasklist" id="tasklist">{tasks.map(({id, name, is_closed, date}) =>
      <li class="task">
        <input type="checkbox" class="task__checkbox" checked={is_closed} hx-get={`/${sessionId}/task/${id}/status/${is_closed ? "open" : "close"}`}  hx-target="#tasklist" hx-swap="outerHTML" />
        <div class="task__data">
          <p class="task__name">{name}</p>
          <p class="task__date">{date}</p>
        </div>
        <button class="task__button" hx-delete={`/${sessionId}/task/${id}`}  hx-target="#tasklist" hx-swap="outerHTML" hx-confirm="Are you sure you wish to delete this task?">🗑️</button>
      </li>)}
    </ul>
  );
}

const TaskForm = ({ sessionId }: { sessionId: string}) => {
  return (
    <form class="taskform" hx-post={`/${sessionId}/task`} hx-target="#tasklist" hx-swap="outerHTML">
      <input class="taskform__text" type="text" name="name" placeholder="Task name" />
      <button class="taskform__button" type="submit">Add</button>
    </form>
  );
}

app.get('/', (c) => {
  const sessionId = Math.random().toString(36).substring(2);
  const url = new URL(c.req.url);
  return Response.redirect(`${url.origin}/${sessionId}`, 302);
});

app.get('/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  return c.html(
    <Layout>
      <main class="container">
        <h1 class="title">Todo List 📝</h1>
        <p class="tip">💡 You can share this URL and collaborate</p>
        <TaskForm sessionId={sessionId} />
        <TaskList sessionId={sessionId} />
        <footer class="footer">
          <p class="footer__text">from <a href="https://github.com/kungfunk">kungfunk</a> with ❤️ <br />
          <a href="https://github.com/kungfunk/deno-htmx-poc">source code</a></p>
        </footer>
      </main>
    </Layout>
  );
});

app.post('/:sessionId/task', async (c) => {
  const sessionId = c.req.param('sessionId');
  const body = await c.req.parseBody();
  const name = body.name as string;
  addTask(sessionId, name);
  return c.html(<TaskList sessionId={sessionId} />);
});

app.get('/:sessionId/task/:id/status/:status', (c) => {
  const id = c.req.param('id');
  const sessionId = c.req.param('sessionId');
  const is_closed = c.req.param('status') === 'close';
  changeTaskStatus(id, is_closed);
  return c.html(<TaskList sessionId={sessionId} />);
});

app.delete('/:sessionId/task/:id', (c) => {
  const id = c.req.param('id');
  const sessionId = c.req.param('sessionId');
  deleteTask(id);
  return c.html(<TaskList sessionId={sessionId} />);
});

app.use('/static/*', serveStatic({ root: './' }))
Deno.serve(app.fetch);
