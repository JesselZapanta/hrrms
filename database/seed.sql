INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES
  (1, 'Personal Information', 1),
  (2, 'Appointment and Employment Documents', 2),
  (3, 'Qualifications and Eligibility', 3),
  (4, 'Medical and Clearance Documents', 4),
  (5, 'Performance Records', 5),
  (6, 'Awards and Recognition', 6),
  (7, 'Disciplinary and Administrative Records', 7),
  (8, 'Other Personnel Documents', 8);

INSERT OR IGNORE INTO subcategories (category_id, name, sort_order) VALUES
  -- 1. Personal Information
  (1, 'Personal Data Sheet (PDS), CS Form No. 212', 1),
  (1, 'Work Experience Sheet', 2),
  (1, 'Certificate of Live Birth', 3),
  (1, 'Marriage Certificate', 4),
  (1, 'Other documents supporting personal information', 5),
  -- 2. Appointment and Employment Documents
  (2, 'Appointment papers', 1),
  (2, 'Position Description Form (PDF)', 2),
  (2, 'Oath of Office', 3),
  (2, 'Certification of Assumption to Duty', 4),
  (2, 'Appointment-related documents', 5),
  (2, 'Promotion / transfer / reappointment / other personnel actions', 6),
  -- 3. Qualifications and Eligibility
  (3, 'Civil Service eligibility', 1),
  (3, 'Professional licenses', 2),
  (3, 'Transcript of Records (TOR)', 3),
  (3, 'Diploma', 4),
  (3, 'Other documents supporting educational qualifications', 5),
  (3, 'Training certificates relevant to the position', 6),
  -- 4. Medical and Clearance Documents
  (4, 'Medical Certificate (CS Form No. 211)', 1),
  (4, 'Required medical examination results', 2),
  (4, 'NBI Clearance', 3),
  (4, 'Other required clearances', 4),
  (4, 'Clearance for financial obligations / property accountability', 5),
  -- 5. Performance Records
  (5, 'Performance ratings', 1),
  (5, 'IPCR / OPCR-related documents', 2),
  (5, 'Performance evaluation documents', 3),
  (5, 'Other documents related to employee performance', 4),
  -- 6. Awards and Recognition
  (6, 'Certificates of commendation', 1),
  (6, 'Awards', 2),
  (6, 'Certificates of achievement', 3),
  (6, 'Recognition documents', 4),
  -- 7. Disciplinary and Administrative Records
  (7, 'Administrative case documents', 1),
  (7, 'Disciplinary action documents', 2),
  (7, 'Other authorized personnel actions related to administrative matters', 3),
  -- 8. Other Personnel Documents
  (8, 'Leave-related personnel documents', 1),
  (8, 'Promotion / transfer documents', 2),
  (8, 'Designation documents', 3),
  (8, 'Training and development records', 4),
  (8, 'Other official documents affecting employment status', 5);

-- Default users: admin / password, staff / password (bcrypt-hashed)
INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES
  ('admin', '$2b$12$h3oqRyG.r3agsSVT4ghrkusBRIFXC35zGuYjWZEjQZmuK3M/VOjjK', 'Administrator', 'admin'),
  ('staff', '$2b$12$h3oqRyG.r3agsSVT4ghrkusBRIFXC35zGuYjWZEjQZmuK3M/VOjjK', 'HR Staff', 'staff');
