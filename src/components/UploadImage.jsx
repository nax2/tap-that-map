import React, { Component } from "react";
import { storage } from "../firebaseInitialise";
import { Button, Typography, Box, LinearProgress } from "@material-ui/core";

class UploadImage extends Component {
  state = {
    image: null,
    url: "",
    progress: 0,
  };

  handleChange = (event) => {
    if (event.target.files[0]) {
      const image = event.target.files[0];
      this.setState(() => ({ image }));
    }
  };

  handleUpload = (event) => {
    event.preventDefault();
    const { image } = this.state;
    const { updateMarker } = this.props;
    const uploadTask = storage.ref(`images/${image.name}`).put(image);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // progress function ...
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        this.setState({ progress });
      },
      (error) => {
        // Error function ...
        console.log(error);
      },
      () => {
        // complete function ...
        storage
          .ref("images")
          .child(image.name)
          .getDownloadURL()
          .then((url) => {
            this.setState({ url });
            updateMarker(url);
          });
      }
    );
  };

  render() {
    const { progress, url } = this.state;
    return (

      <Box id="upload-image-wrapper">
        <Typography variant="h4">Choose a custom marker</Typography>
        <Box className="two-item-box">
          <input type="file" onChange={this.handleChange} />
          <Button
            onClick={this.handleUpload}
            variant="contained"
            color="primary"
          >
            Upload
            </Button>
        </Box>
        <LinearProgress variant="determinate" value={progress} max="100" />
        <Box className="two-item-box">
          <Typography variant="h4">Current marker:</Typography>
          <img
            src={url || "https://img.icons8.com/emoji/2x/duck-emoji.png"}
            alt="Uploaded Images"
            height="50"
            width="50"
          />
        </Box>
      </Box>

    );
  }
}

export default UploadImage;
