/** @jsx jsx */
import { Hono } from 'https://deno.land/x/hono@v3.3.4/mod.ts';
import { jsx, html, serveStatic } from 'https://deno.land/x/hono@v3.3.4/middleware.ts';
import { format } from "https://deno.land/std@0.197.0/datetime/format.ts";

const app = new Hono();

interface Task {
  id: number;
  name: string;
  date: string;
}

const tasks: Task[] = [
  { id: 1, name: 'Lore ipsum dolor sit amet', date: '2023-08-05 08:09:10.562' },
  { id: 2, name: 'Cras sit amet arcu ut nunc aliquet feugiat at suscipit augue', date: '2023-08-04 03:01:10.233' },
  { id: 3, name: 'Vivamus finibus nulla nec posuere lacinia. Quisque eleifend nec quam et cursus. Duis orci augue, dignissim sit amet blandit eget, porta vitae purus. ', date: '2023-08-05 08:09:10.562' },
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
  return (
    <ul class="tasklist" id="tasklist">{tasks.map(({id, name, date}) =>
      <li class="task">
        <input type="checkbox" class="task__checkbox" hx-delete={"/task/"+id}  hx-target="#tasklist" hx-swap="outerHTML swap:1s" />
        <div>
          <p class="task__name">{name}</p>
          <p class="task__date">{date}</p>
        </div>
      </li>)}
    </ul>
  );
}

app.get('/', (c) => {
  return c.html(
    <Layout>
      <main class="container">
        <h1 class="title">Todo List ✏️</h1>
        <p class="tip">💡 You can share this URL and colaborate</p>
        <form class="taskform" hx-post="/task" hx-target="#tasklist" hx-swap="outerHTML">
          <input class="taskform__text" type="text" name="name" placeholder="Task name" />
          <button class="taskform__button" type="submit">Add</button>
        </form>
        <TaskList tasks={tasks} />
        <footer class="footer">
          <p class="footer__text">from kungfunk with ❤️</p>
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
  tasks.push({ id, name: name, date });
  return c.html(<TaskList tasks={tasks} />);
});

app.delete('/task/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  tasks.splice(tasks.findIndex(task => task.id === id), 1);
  return c.html(<TaskList tasks={tasks} />);
});

app.use('/static/*', serveStatic({ root: './' }))
Deno.serve(app.fetch);
