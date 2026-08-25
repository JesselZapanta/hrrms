import { contextBridge, ipcRenderer } from 'electron'

const api = {
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
    quitAndInstall: () => ipcRenderer.invoke('app:quitAndInstall'),
    onUpdateStatus: (cb) => {
      const handler = (_, data) => cb(data)
      ipcRenderer.on('updater:status', handler)
      return () => ipcRenderer.removeListener('updater:status', handler)
    }
  },
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password)
  },
  users: {
    list: () => ipcRenderer.invoke('users:list'),
    create: (data) => ipcRenderer.invoke('users:create', data),
    update: (id, data) => ipcRenderer.invoke('users:update', id, data),
    remove: (id) => ipcRenderer.invoke('users:remove', id)
  },
  employees: {
    list: (query = {}) => ipcRenderer.invoke('employees:list', query),
    get: (id) => ipcRenderer.invoke('employees:get', id),
    create: (data) => ipcRenderer.invoke('employees:create', data),
    update: (id, data) => ipcRenderer.invoke('employees:update', id, data),
    remove: (id) => ipcRenderer.invoke('employees:remove', id)
  },
  categories: {
    listAll: () => ipcRenderer.invoke('categories:listAll'),
    list: () => ipcRenderer.invoke('categories:list'),
    create: (name, sort) => ipcRenderer.invoke('categories:create', name, sort),
    update: (id, data) => ipcRenderer.invoke('categories:update', id, data),
    remove: (id) => ipcRenderer.invoke('categories:remove', id),
    createSub: (categoryId, name, sort) => ipcRenderer.invoke('categories:createSub', categoryId, name, sort),
    updateSub: (id, data) => ipcRenderer.invoke('categories:updateSub', id, data),
    removeSub: (id) => ipcRenderer.invoke('categories:removeSub', id)
  },
  offices: {
    list: (query = {}) => ipcRenderer.invoke('offices:list', query),
    create: (data) => ipcRenderer.invoke('offices:create', data),
    update: (id, data) => ipcRenderer.invoke('offices:update', id, data),
    remove: (id) => ipcRenderer.invoke('offices:remove', id)
  },
  salaryGrades: {
    list: (query = {}) => ipcRenderer.invoke('salaryGrades:list', query),
    listGrouped: (query = {}) => ipcRenderer.invoke('salaryGrades:listGrouped', query),
    listGrades: () => ipcRenderer.invoke('salaryGrades:listGrades'),
    get: (id) => ipcRenderer.invoke('salaryGrades:get', id),
    getByGradeStep: (grade, step) => ipcRenderer.invoke('salaryGrades:getByGradeStep', grade, step),
    create: (data) => ipcRenderer.invoke('salaryGrades:create', data),
    update: (id, data) => ipcRenderer.invoke('salaryGrades:update', id, data),
    upsert: (data) => ipcRenderer.invoke('salaryGrades:upsert', data),
    upsertGrade: (grade, steps) => ipcRenderer.invoke('salaryGrades:upsertGrade', grade, steps),
    remove: (id) => ipcRenderer.invoke('salaryGrades:remove', id),
    removeGrade: (grade) => ipcRenderer.invoke('salaryGrades:removeGrade', grade)
  },
  files: {
    list: (employeeId) => ipcRenderer.invoke('files:list', employeeId),
    upload: (data) => ipcRenderer.invoke('files:upload', data),
    uploadFromPath: (data) => ipcRenderer.invoke('files:uploadFromPath', data),
    rename: (id, name) => ipcRenderer.invoke('files:rename', id, name),
    remove: (id) => ipcRenderer.invoke('files:remove', id),
    openPath: (id) => ipcRenderer.invoke('files:openPath', id)
  },
  dialog: {
    pickPdf: () => ipcRenderer.invoke('dialog:pickPdf'),
    pickFile: () => ipcRenderer.invoke('dialog:pickFile')
  }
}

contextBridge.exposeInMainWorld('api', api)
