const bcrypt = require('bcryptjs');
const hashInDb = '$2b$10$1FwuhpD09hGyP5TrJ2iLreGxIwS.SO4GD4.ZqX9s3BnQDBOrjNKze';
const pass = 'g250491';

bcrypt.compare(pass, hashInDb).then(res => {
  console.log('Match:', res);
  if (!res) {
    bcrypt.hash(pass, 10).then(newHash => {
      console.log('New Hash suggested:', newHash);
    });
  }
});
