var distance = require('google-distance');
distance.get(
  {
    origin: '20.9602066, 105.8003899',
    destination: 'Ecolife Capital, Tố Hữu, Trung Văn, Từ Liêm, Hà Nội, Vietnam'
  },
  function(err, data) {
    if (err) return console.log(err);
    console.log(data);
});
