-- Wipe demo rounds, fake donors, and invented geography.
-- Fresh house: round 1, zero collected, no previous winner.

delete from messages;
delete from members;
delete from donations;
delete from rounds;

insert into rounds (id, target_usdt, collected_usdt, donor_count, status)
values (1, 1000000, 0, 0, 'open');

select setval('rounds_id_seq', 1, true);
select setval('donations_id_seq', 1, false);
select setval('messages_id_seq', 1, false);
