CREATE DATABASE IF NOT EXISTS smartcampus_identity;
CREATE DATABASE IF NOT EXISTS smartcampus_ticket;
CREATE DATABASE IF NOT EXISTS smartcampus_department;

-- Cleanup legacy leftovers from earlier splits.
DROP DATABASE IF EXISTS smartcampus_category;
DROP TABLE IF EXISTS smartcampus_ticket.departments;
