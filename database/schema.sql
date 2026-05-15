CREATE TABLE IF NOT EXISTS users (
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS sellers (
  seller_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  campus_id VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (seller_id),
  UNIQUE KEY uq_sellers_email (email)
);

CREATE TABLE IF NOT EXISTS seller_img (
  image_id INT NOT NULL,
  seller_id INT NOT NULL,
  image_url TEXT NOT NULL,
  is_profile_pic TINYINT(1) NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (image_id),
  KEY idx_seller_img_seller_id (seller_id),
  CONSTRAINT fk_seller_img_seller FOREIGN KEY (seller_id) REFERENCES sellers (seller_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
  item_id INT NOT NULL,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  condition_status VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  KEY idx_items_user_id (user_id),
  KEY idx_items_category_id (category_id),
  CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_images (
  image_id INT NOT NULL,
  item_id INT NOT NULL,
  image_url TEXT NOT NULL,
  PRIMARY KEY (image_id),
  KEY idx_item_images_item_id (item_id),
  CONSTRAINT fk_item_images_item FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  review_id INT NOT NULL,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  KEY idx_reviews_user_id (user_id),
  KEY idx_reviews_item_id (item_id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_item FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id INT NOT NULL,
  buyer_id INT NOT NULL,
  item_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (transaction_id),
  KEY idx_transactions_buyer_id (buyer_id),
  KEY idx_transactions_item_id (item_id),
  CONSTRAINT fk_transactions_buyer FOREIGN KEY (buyer_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_item FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id INT NOT NULL,
  transaction_id INT NOT NULL,
  payment_method VARCHAR(100) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (payment_id),
  KEY idx_payments_transaction_id (transaction_id),
  CONSTRAINT fk_payments_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  message_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  item_id INT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id),
  KEY idx_messages_sender_id (sender_id),
  KEY idx_messages_receiver_id (receiver_id),
  KEY idx_messages_item_id (item_id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_item FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE
);

CREATE OR REPLACE VIEW transactionsummary AS
SELECT
  t.transaction_id AS transaction_id,
  buyer.name AS buyer,
  i.title AS title,
  t.amount AS amount,
  t.status AS status
FROM transactions t
INNER JOIN users buyer ON buyer.user_id = t.buyer_id
INNER JOIN items i ON i.item_id = t.item_id;
