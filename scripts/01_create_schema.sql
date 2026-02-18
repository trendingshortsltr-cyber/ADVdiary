-- Create cases table
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  case_number TEXT NOT NULL,
  court_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Closed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, case_number)
);

-- Create hearing_dates table
CREATE TABLE hearing_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX cases_user_id_idx ON cases(user_id);
CREATE INDEX cases_status_idx ON cases(status);
CREATE INDEX hearing_dates_case_id_idx ON hearing_dates(case_id);
CREATE INDEX hearing_dates_date_idx ON hearing_dates(date);

-- Enable RLS (Row Level Security)
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearing_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cases table
CREATE POLICY "Users can view their own cases" ON cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cases" ON cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases" ON cases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases" ON cases
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for hearing_dates table
CREATE POLICY "Users can view hearing dates for their cases" ON hearing_dates
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM cases WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert hearing dates for their cases" ON hearing_dates
  FOR INSERT WITH CHECK (
    case_id IN (
      SELECT id FROM cases WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update hearing dates for their cases" ON hearing_dates
  FOR UPDATE USING (
    case_id IN (
      SELECT id FROM cases WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete hearing dates for their cases" ON hearing_dates
  FOR DELETE USING (
    case_id IN (
      SELECT id FROM cases WHERE user_id = auth.uid()
    )
  );
