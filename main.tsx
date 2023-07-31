/** @jsx jsx */
import { Hono } from 'https://deno.land/x/hono@v3.3.4/mod.ts';
import { jsx, html } from 'https://deno.land/x/hono@v3.3.4/middleware.ts';

const app = new Hono();

interface Task {
  id: number;
  name: string;
}

const tasks: Task[] = [
  { id: 1, name: 'Task 1' },
  { id: 2, name: 'Task 2' },
  { id: 3, name: 'Task 3' },
];

const Layout = ({ children }: { children: any }) => html`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <script src="https://unpkg.com/htmx.org@1.9.4"></script>
    <title>Task manager</title>
  </head>
  <body>
    <main class="container">
      ${children}
    </main>
  </body>
</html>
`;

const TaskList = ({ tasks }: { tasks: Task[] }) => {
  return <ul id="tasks">{tasks.map(task => <li>{task.name}</li>)}</ul>;
}

app.get('/', (c) => {
  return c.html(
    <Layout>
      <h1>Tasks</h1>
      <TaskList tasks={tasks} />
      <h2>Add new Task</h2>
      <form hx-post="/task" hx-target="#tasks" hx-swap="outerHTML">
        <input type="text" name="name" placeholder="Task name" />
        <button type="submit">Add Task</button>
      </form>
    </Layout>
  );
});

app.post('/task', async (c) => {
  const body = await c.req.parseBody();
  tasks.push({ id: tasks.length + 1, name: body.name });
  return c.html(<TaskList tasks={tasks} />);
});

Deno.serve(app.fetch);