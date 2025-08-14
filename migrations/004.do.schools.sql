CREATE TABLE schools_on (
  id SERIAL PRIMARY KEY,
  name VARCHAR (255) NOT NULL,
  base_url VARCHAR (255) NOT NULL,
  logo_url VARCHAR (255) NOT NULL,
  date_onboard DATE NULL
);