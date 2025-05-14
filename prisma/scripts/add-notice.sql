-- General Gambling Discussion 게시판에 공지사항 추가
INSERT INTO Post (postKey, title, content, userCode, boardId, isNotice, createdAt)
VALUES (
  'notice-general-001',
  'General Gambling Discussion 공지사항',
  '이것은 General Gambling Discussion 게시판의 공지사항입니다.',
  'a2381016@gmail.com',
  1,
  1,
  datetime('now')
);

-- Casinos 게시판에 공지사항 추가
INSERT INTO Post (postKey, title, content, userCode, boardId, isNotice, createdAt)
VALUES (
  'notice-casinos-001',
  'Casinos 공지사항',
  '이것은 Casinos 게시판의 공지사항입니다.',
  'a2381016@gmail.com',
  5,
  1,
  datetime('now')
); 