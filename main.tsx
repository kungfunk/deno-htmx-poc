/** @jsx jsx */
import { Hono } from 'https://deno.land/x/hono@v3.3.4/mod.ts';
import { jsx, html, serveStatic } from 'https://deno.land/x/hono@v3.3.4/middleware.ts';
import { format } from "https://deno.land/std@0.197.0/datetime/format.ts";

const app = new Hono();

interface Task {
  id: number;
  is_closed: boolean;
  name: string;
  date: string;
}

const tasks: Task[] = [
  { id: 1, is_closed: true, name: 'Lore ipsum dolor sit amet', date: '2023-08-05 08:09:10.562' },
  { id: 2, is_closed: false, name: 'Cras sit amet arcu ut nunc aliquet feugiat at suscipit augue', date: '2023-08-04 03:01:10.233' },
  { id: 3, is_closed: true, name: 'Vivamus finibus nulla nec posuere lacinia. Quisque eleifend nec quam et cursus. Duis orci augue, dignissim sit amet blandit eget, porta vitae purus. ', date: '2023-08-05 08:09:10.562' },
];

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

const TaskList = ({ tasks }: { tasks: Task[] }) => {
  if (tasks.length === 0) return (<p class="tasklist__empty">Empty bucket, good for you!</p>);
  return (
    <ul class="tasklist" id="tasklist">{tasks.map(({id, name, is_closed, date}) =>
      <li class="task">
        <input type="checkbox" class="task__checkbox" checked={is_closed} hx-get={"/task/" + id + "/status/" + (is_closed ? "open" : "close")}  hx-target="#tasklist" hx-swap="outerHTML" />
        <div class="task__data">
          <p class="task__name">{name}</p>
          <p class="task__date">{date}</p>
        </div>
        <button class="task__button" hx-delete={"/task/"+id}  hx-target="#tasklist" hx-swap="outerHTML" hx-confirm="Are you sure you wish to delete this task?">🗑️</button>
      </li>)}
    </ul>
  );
}

const TaskForm = () => {
  return (
    <form class="taskform" hx-post="/task" hx-target="#tasklist" hx-swap="outerHTML">
      <input class="taskform__text" type="text" name="name" placeholder="Task name" />
      <button class="taskform__button" type="submit">Add</button>
    </form>
  );
}

app.get('/', (c) => {
  return c.html(
    <Layout>
      <main class="container">
        <h1 class="title">Todo List 📝</h1>
        <p class="tip">💡 You can share this URL and collaborate</p>
        <TaskForm />
        <TaskList tasks={tasks} />
        <footer class="footer">
          <p class="footer__text">from kungfunk with ❤️ <br />
          <a href="https://github.com/kungfunk/deno-htmx-poc">source code</a></p>
        </footer>
      </main>
    </Layout>
  );
});

app.post('/task', async (c) => {
  const body = await c.req.parseBody();
  const id = tasks.length + 1;
  const name = body.name as string;
  const date = format(new Date(), "yyyy-MM-dd hh:mm:ss.SSS");
  tasks.push({ id, is_closed: false, name, date });
  return c.html(<TaskList tasks={tasks} />);
});

app.get('/task/:id/status/:status', (c) => {
  const id = parseInt(c.req.param('id'));
  const is_closed = c.req.param('status') === 'close';
  const index = tasks.findIndex(task => task.id === id);
  tasks[index] = { ...tasks[index], is_closed };
  return c.html(<TaskList tasks={tasks} />);
});

app.put('/task/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.parseBody();
  const name = body.name as string;
  const index = tasks.findIndex(task => task.id === id);
  tasks[index] = { ...tasks[index], name };
  return c.html(<TaskList tasks={tasks} />);
});

app.delete('/task/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  tasks.splice(tasks.findIndex(task => task.id === id), 1);
  return c.html(<TaskList tasks={tasks} />);
});

app.use('/static/*', serveStatic({ root: './' }))
Deno.serve(app.fetch);
