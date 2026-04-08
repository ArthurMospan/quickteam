const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'kanban.db');
const db = new sqlite3.Database(dbPath);

// Initial Data from Prototype
const initialColumns = [
  { id: 'col-1', title: 'Column 1' },
  { id: 'col-2', title: 'Column 2' },
  { id: 'col-3', title: 'Column 3' },
  { id: 'col-4', title: 'Column 4' },
  { id: 'col-5', title: 'Column 5' }
];

const initialTasks = [
  { id: 'task-1', title: 'Develop Processing Plans', user: 'Clair Burge', date: '12.11.23', color: 'purple', hasBookmark: true, colId: 'col-1', avatar: 'https://i.pravatar.cc/150?u=clair' },
  { id: 'task-2', title: 'Develop Strategic Plans', user: 'Christian Bass', date: '15.11.23', color: 'purple-light', hasBookmark: false, colId: 'col-1', avatar: 'https://i.pravatar.cc/150?u=christian' },
  { id: 'task-3', title: 'Build Relationships', user: 'Craig Curry', date: '21.11.23', color: 'white', hasBookmark: false, colId: 'col-1', avatar: 'https://i.pravatar.cc/150?u=craig' },
  { id: 'task-4', title: 'Create Training Programs', user: 'Brandon Crawford', date: '23.11.23', color: 'gray', hasBookmark: false, colId: 'col-1', avatar: 'https://i.pravatar.cc/150?u=brandon' },
  
  { id: 'task-5', title: 'Resolve Payment Disputes', user: 'Clair Burge', date: '8.11.23', color: 'purple-light', hasBookmark: false, colId: 'col-2', avatar: 'https://i.pravatar.cc/150?u=clair' },
  { id: 'task-6', title: 'Provide Customer Service', user: 'Christian Bass', date: '9.11.23', color: 'purple', hasBookmark: true, colId: 'col-2', avatar: 'https://i.pravatar.cc/150?u=christian' },
  { id: 'task-7', title: 'Resolve Disputes', user: 'Brandon Crawford', date: '20.11.23', color: 'white', hasBookmark: false, colId: 'col-2', avatar: 'https://i.pravatar.cc/150?u=brandon' },
  { id: 'task-8', title: 'Develop Processing Plans', user: 'Helna Julie', date: '22.11.23', color: 'purple-light', hasBookmark: true, colId: 'col-2', avatar: 'https://i.pravatar.cc/150?u=helna' },
  
  { id: 'task-9', title: 'Train Employees', user: 'Craig Curry', date: '8.11.23', color: 'purple-light', hasBookmark: false, colId: 'col-3', avatar: 'https://i.pravatar.cc/150?u=craig' },
  { id: 'task-10', title: 'Improve Efficiency', user: 'Christian Bass', date: '10.11.23', color: 'white', hasBookmark: false, colId: 'col-3', avatar: 'https://i.pravatar.cc/150?u=christian' },
  { id: 'task-11', title: 'Report To Management', user: 'Clair Burge', date: '14.11.23', color: 'purple-light', hasBookmark: false, colId: 'col-3', avatar: 'https://i.pravatar.cc/150?u=clair' },
  
  { id: 'task-12', title: 'Recruit New Talent', user: 'Helna Julie', date: '4.11.23', color: 'yellow', hasBookmark: false, colId: 'col-4', avatar: 'https://i.pravatar.cc/150?u=helna' },
  { id: 'task-13', title: 'Market Services', user: 'Clair Burge', date: '5.11.23', color: 'yellow', hasBookmark: false, colId: 'col-4', avatar: 'https://i.pravatar.cc/150?u=clair' },
  
  { id: 'task-14', title: 'Oversee Operations', user: 'Christian Bass', date: '1.12.23', color: 'white', hasBookmark: false, colId: 'col-5', avatar: 'https://i.pravatar.cc/150?u=christian' },
  { id: 'task-15', title: 'Implement New Technologies', user: 'Clair Burge', date: '4.12.23', color: 'white', hasBookmark: false, colId: 'col-5', avatar: 'https://i.pravatar.cc/150?u=clair' },
  { id: 'task-16', title: 'Launch Marketing Campaigns', user: 'Brandon Crawford', date: '5.02.24', color: 'white', hasBookmark: false, colId: 'col-5', avatar: 'https://i.pravatar.cc/150?u=brandon' },
  { id: 'task-17', title: 'Oversee Operations', user: 'Helna Julie', date: '6.12.23', color: 'white', hasBookmark: false, colId: 'col-5', avatar: 'https://i.pravatar.cc/150?u=helna' }
];

// Initialize DB and Seed Data if empty
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    title TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT,
    user TEXT,
    date TEXT,
    color TEXT,
    hasBookmark BOOLEAN,
    colId TEXT,
    avatar TEXT,
    FOREIGN KEY(colId) REFERENCES columns(id)
  )`);

  db.get('SELECT COUNT(*) as count FROM columns', (err, row) => {
    if (row && row.count === 0) {
      console.log('Seeding initial data...');
      
      const insertCol = db.prepare('INSERT INTO columns (id, title) VALUES (?, ?)');
      initialColumns.forEach(c => insertCol.run(c.id, c.title));
      insertCol.finalize();

      const insertTask = db.prepare(`INSERT INTO tasks 
        (id, title, user, date, color, hasBookmark, colId, avatar) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      initialTasks.forEach(t => insertTask.run(
        t.id, t.title, t.user, t.date, t.color, t.hasBookmark ? 1 : 0, t.colId, t.avatar
      ));
      insertTask.finalize();
      
      console.log('Seed complete.');
    }
  });
});

const getBoardData = () => {
  return new Promise((resolve, reject) => {
    const data = { columns: [], tasks: {} };
    
    db.all('SELECT * FROM columns', (err, rows) => {
      if (err) return reject(err);
      data.columns = rows;
      
      db.all('SELECT * FROM tasks', (err, taskRows) => {
        if (err) return reject(err);
        
        // Convert to key-value object expected by frontend
        taskRows.forEach(t => {
          data.tasks[t.id] = {
            ...t,
            hasBookmark: t.hasBookmark === 1
          };
        });
        
        resolve(data);
      });
    });
  });
};

const updateTaskColumn = (taskId, colId) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE tasks SET colId = ? WHERE id = ?', [colId, taskId], function(err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
};

module.exports = {
  db,
  getBoardData,
  updateTaskColumn
};
