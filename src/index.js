const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const user = users.find(user => user.username === username)

  if (!user) {
    return response.status(400).json({ error: "User not found" })
  }

  request.user = user

  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const userExists = users.some(user => user.username === username)

  if (userExists) {
    return response.status(400).json({ error: "User already exists" })
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser)

  return response.json(newUser)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { todos } = request.user

  return response.json(todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { todos, username } = request.user

  const todosList = todos

  const newTodo = { 
    id: uuidv4(),
    title: title,
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date()
  }

  todosList.push(newTodo)

  const userIndex = users.findIndex(user => user.username === username)

  users[userIndex].todos = todosList

  return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { id } = request.params
  const { todos, username } = request.user

  const oldTodo = todos.find(todo => todo.id === id)

  if (!oldTodo) {
    return response.status(404).json({ error: "Todo not found" })
  }

  const oldTodoIndex = todos.findIndex(todo => todo.id === id)
  const userIndex = users.findIndex(user => user.username === username)

  const newTodo = {
    ...oldTodo,
    title,
    deadline
  }

  users[userIndex].todos[oldTodoIndex] = newTodo

  return response.json(newTodo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { todos, username } = request.user

  const oldTodo = todos.find(todo => todo.id === id)

  if (!oldTodo) {
    return response.status(404).json({ error: "Todo not found" })
  }

  const oldTodoIndex = todos.findIndex(todo => todo.id === id)
  const userIndex = users.findIndex(user => user.username === username)

  const newTodo = {
    ...oldTodo,
    done: true
  }

  users[userIndex].todos[oldTodoIndex] = newTodo

  return response.json(newTodo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { todos, username } = request.user
  
  const oldTodoIndex = todos.findIndex(todo => todo.id === id)
  
  if (oldTodoIndex === -1) {
    return response.status(404).json({ error: "Todo not found" })
  }

  const userIndex = users.findIndex(user => user.username === username)

  users[userIndex].todos.splice(oldTodoIndex, 1);

  return response.status(204).json({ message: "Todo deleted" })
});

module.exports = app;
