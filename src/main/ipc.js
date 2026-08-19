import { ipcMain, dialog, shell } from 'electron'
import { AuthService } from './services/AuthService.js'
import { UserService } from './services/UserService.js'
import { EmployeeService } from './services/EmployeeService.js'
import { CategoryService } from './services/CategoryService.js'
import { FileService } from './services/FileService.js'

const wrap = (fn) => async (_event, ...args) => {
  try {
    const result = await fn(...args)
    return { ok: true, data: result }
  } catch (err) {
    return { ok: false, error: err.message || 'Unknown error' }
  }
}

export function registerIpc() {
  // Auth
  ipcMain.handle('auth:login', wrap((u, p) => AuthService.login(u, p)))

  // Users (admin)
  ipcMain.handle('users:list', wrap(() => UserService.list()))
  ipcMain.handle('users:create', wrap((d) => UserService.create(d)))
  ipcMain.handle('users:update', wrap((id, d) => UserService.update(id, d)))
  ipcMain.handle('users:remove', wrap((id) => UserService.remove(id)))

  // Employees
  ipcMain.handle('employees:list', wrap((q) => EmployeeService.list(q)))
  ipcMain.handle('employees:get', wrap((id) => EmployeeService.get(id)))
  ipcMain.handle('employees:create', wrap((d) => EmployeeService.create(d)))
  ipcMain.handle('employees:update', wrap((id, d) => EmployeeService.update(id, d)))
  ipcMain.handle('employees:remove', wrap((id) => EmployeeService.remove(id)))

  // Categories
  ipcMain.handle('categories:listAll', wrap(() => CategoryService.listAll()))
  ipcMain.handle('categories:list', wrap(() => CategoryService.list()))
  ipcMain.handle('categories:create', wrap((name, sort) => CategoryService.create(name, sort)))
  ipcMain.handle('categories:update', wrap((id, d) => CategoryService.update(id, d)))
  ipcMain.handle('categories:remove', wrap((id) => CategoryService.remove(id)))
  ipcMain.handle('categories:createSub', wrap((cid, name, sort) => CategoryService.createSubcategory(cid, name, sort)))
  ipcMain.handle('categories:updateSub', wrap((id, d) => CategoryService.updateSubcategory(id, d)))
  ipcMain.handle('categories:removeSub', wrap((id) => CategoryService.removeSubcategory(id)))

  // Files
  ipcMain.handle('files:list', wrap((employeeId) => FileService.listByEmployee(employeeId)))
  ipcMain.handle('files:upload', wrap((d) => FileService.upload(d)))
  ipcMain.handle('files:uploadFromPath', wrap((d) => FileService.uploadFromPath(d)))
  ipcMain.handle('files:rename', wrap((id, name) => FileService.rename(id, name)))
  ipcMain.handle('files:remove', wrap((id) => FileService.remove(id)))
  ipcMain.handle('files:openPath', wrap((id) => {
    const file = FileService.getPath(id)
    if (!file) throw new Error('File not found')
    shell.openPath(file.file_path)
    return file.file_path
  }))

  // Dialogs
  ipcMain.handle('dialog:pickPdf', wrap(async () => {
    const res = await dialog.showOpenDialog({
      title: 'Select PDF file',
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      properties: ['openFile']
    })
    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  }))
}
