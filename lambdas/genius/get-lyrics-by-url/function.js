exports.handler = async (event) => {
  console.log(event);
  axios.get('https://genius.com/Aaron-may-temporary-lyrics').then((response) => {
    console.log(response);
  };

  return event;
};
