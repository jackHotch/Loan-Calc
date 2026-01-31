CREATE TYPE strategy_type AS ENUM (
  'SNOWBALL',
  'AVALANCHE',
  'CUSTOM',
  'EXTRA_PAYMENT',
  'TARGETED'
);

CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255)
);

CREATE TABLE loans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lender TEXT,
  principal DECIMAL(12, 2) NOT NULL,
  current_balance DECIMAL(12, 2) NOT NULL,
  accrued_interest DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  minimum_payment DECIMAL(10, 2) NOT NULL,
  term_months INTEGER,
  remaining_months INTEGER,
  start_date TIMESTAMP NOT NULL,
  extra_payment DECIMAL(12, 2)
);

CREATE TABLE simulations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type strategy_type NOT NULL,
  extra_monthly_amount DECIMAL(10, 2),
  extra_monthly_strategy TEXT,
  one_time_payment DECIMAL(10, 2),
  one_time_payment_date DATE,
  total_paid DECIMAL(12, 2),
  total_interest_paid DECIMAL(12, 2),
  months_to_payoff INTEGER,
  payoff_date DATE,
  total_savings DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE simulation_loans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  simulation_id BIGINT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  loan_id BIGINT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  principal_amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  minimum_payment DECIMAL(10, 2) NOT NULL,
  payoff_month INTEGER NOT NULL,
  total_interest DECIMAL(12, 2) NOT NULL,
  total_paid DECIMAL(12, 2) NOT NULL,
  payoff_order INTEGER,
  UNIQUE(simulation_id, loan_id)
);

CREATE TABLE payment_schedules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  simulation_id BIGINT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  total_payment DECIMAL(10, 2) NOT NULL,
  total_principal DECIMAL(10, 2) NOT NULL,
  total_interest DECIMAL(10, 2) NOT NULL,
  remaining_balance DECIMAL(12, 2) NOT NULL,
  UNIQUE(simulation_id, month_number)
);

CREATE TABLE payment_schedule_details (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_schedule_id BIGINT REFERENCES payment_schedules(id),
  loan_id BIGINT REFERENCES loans(id),
  principal_paid DECIMAL(10, 2),
  interest_paid DECIMAL(10, 2),
  remaining_balance DECIMAL(12, 2)
);




