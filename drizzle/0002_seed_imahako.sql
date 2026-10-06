-- 今葉瑚のスケジュール初期登録(一度だけ実行される)。曲名は仮。
INSERT INTO "artists" ("name", "color", "sort_order")
SELECT '今葉瑚', '#ec4899', 10
WHERE NOT EXISTS (SELECT 1 FROM "artists" WHERE "name" = '今葉瑚');
--> statement-breakpoint
INSERT INTO "releases" ("artist_id", "title", "type", "release_date", "music_submission_date", "jacket_submission_date", "teaser_release_date", "teaser_shoot_date", "created_by", "updated_by")
SELECT a."id", v."title", 'single', v."release"::date, v."music"::date, v."jacket"::date, v."teaser_release"::date, v."teaser_shoot"::date, 'import', 'import'
FROM (VALUES
  ('新曲1(仮)', '2026-11-05', '2026-10-15', '2026-10-22', '2026-11-04', '2026-10-28'),
  ('新曲2(仮)', '2026-12-05', '2026-11-04', '2026-11-11', '2026-12-04', '2026-11-27'),
  ('新曲3(仮)', '2027-01-05', '2026-12-11', '2026-12-19', '2027-01-04', '2026-12-28'),
  ('新曲4(仮)', '2027-02-05', '2027-01-15', '2027-01-22', '2027-02-04', '2027-01-28'),
  ('新曲5(仮)', '2027-03-05', '2027-02-12', '2027-02-19', '2027-03-04', '2027-02-25')
) AS v("title", "release", "music", "jacket", "teaser_release", "teaser_shoot")
CROSS JOIN (SELECT "id" FROM "artists" WHERE "name" = '今葉瑚' ORDER BY "id" LIMIT 1) AS a
WHERE NOT EXISTS (
  SELECT 1 FROM "releases" r WHERE r."artist_id" = a."id" AND r."title" = v."title"
);
