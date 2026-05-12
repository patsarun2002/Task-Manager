import axios from 'axios'

const BASE = 'http://localhost:3001/api/tasks'

export const getTasks = (params) => axios.get(BASE, { params })
export const createTask = (data) => axios.post(BASE, data)
export const updateTask = (id, data) => axios.put(`${BASE}/${id}`, data)
export const deleteTask = (id) => axios.delete(`${BASE}/${id}`)