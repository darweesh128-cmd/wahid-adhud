-- Join unit is 5 USDT. Existing donations keep their recorded amounts.
alter table donations alter column amount_usdt set default 5;
