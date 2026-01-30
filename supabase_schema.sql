-- Create a table for public profiles using Supabase Auth
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  stripe_customer_id text,
  subscription_status text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies for profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Create materials table
create table materials (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  price numeric not null,
  unit text not null,
  vendor text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for materials
alter table materials enable row level security;

-- Create policies for materials
create policy "Users can crud own materials" on materials for all using (auth.uid() = user_id);

-- Create menus table
create table menus (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for menus
alter table menus enable row level security;

-- Create policies for menus
create policy "Users can crud own menus" on menus for all using (auth.uid() = user_id);

-- Create recipes table
create table recipes (
  id uuid default uuid_generate_v4() primary key,
  menu_id uuid references menus on delete cascade not null,
  material_id uuid references materials on delete cascade not null,
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for recipes
-- Note: We check the user_id via the parent menu table to ensure ownership
alter table recipes enable row level security;

create policy "Users can view recipes of own menus" on recipes for select using (
  exists ( select 1 from menus where id = recipes.menu_id and user_id = auth.uid() )
);

create policy "Users can insert recipes to own menus" on recipes for insert with check (
  exists ( select 1 from menus where id = menu_id and user_id = auth.uid() )
);

create policy "Users can update recipes of own menus" on recipes for update using (
  exists ( select 1 from menus where id = recipes.menu_id and user_id = auth.uid() )
);

create policy "Users can delete recipes of own menus" on recipes for delete using (
  exists ( select 1 from menus where id = recipes.menu_id and user_id = auth.uid() )
);

-- Set up a trigger to automatically create a profile entry when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
