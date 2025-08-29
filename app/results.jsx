"use client"
import React, { useState } from "react";
import recognise from "./recognise";

const Results = () => {
  const [result, setResult] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchImdbId = async (qid) => {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log("Wikidata response:", data);
      // Navigate to the P345 property
      const imdbId = data.entities[qid].claims.P345[0].mainsnak.datavalue.value;

      console.log(`IMDb ID: ${imdbId}`);
      return imdbId;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  const getImdbLink = async (face) => {
    const imbdUrl = face.Urls.find(url => url.includes("imdb.com"));
    if (imbdUrl) {
      return imbdUrl
    } 
    if (face.Urls && face.Urls[0]) {
        let id = await fetchImdbId(face.Urls[0].split("/").pop());
        return `imdb.com/name/${id}`;

    }
    return null;
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files[0];
    setImage(URL.createObjectURL(file));
    console.log("Selected file:", file);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageBytes = e.target.result.split(",")[1]; // Remove the base64 prefix
      const [response, message] = await recognise(imageBytes);
      setResult(response);
      console.log(response);
      let updatedResponse = response;
      setLoading(false);
      setChecking(true);
      if (updatedResponse.CelebrityFaces) {
        let newCelebFaces = [];
        for (let i = 0; i < updatedResponse.CelebrityFaces.length; i++) {
          const imdbUrl = await getImdbLink(updatedResponse.CelebrityFaces[i]);
          const newUrls = imdbUrl
            ? [...updatedResponse.CelebrityFaces[i].Urls, imdbUrl]
            : [...updatedResponse.CelebrityFaces[i].Urls];
          newCelebFaces.push({
            ...updatedResponse.CelebrityFaces[i],
            imdb: imdbUrl
          });
        }
        updatedResponse = {
          ...updatedResponse,
          CelebrityFaces: newCelebFaces,
        };
      }
      setChecking(false);
      setResult(updatedResponse);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form style={{ padding: "20px" }}>
      <h1>Celebrity Recognition</h1>
      <input type="file" accept="image/*" onChange={handlePhotoChange} />
      {loading ? "loading..." : null}
      {result && (
        <div>
          <img src={image} alt="Uploaded" style={{ maxWidth: "300px" }} />
          <h3>In this image:</h3>
          {result.CelebrityFaces && result.CelebrityFaces.length > 0 ? (
            <ul>
              {result.CelebrityFaces.map((celebrity, index) => (
                <li key={index}>
                  <img width={100} height={100} src={image} style={{border: "2px red inset", objectFit: "fill", objectPosition: `${celebrity.Face.BoundingBox.Left * 120}% ${celebrity.Face.BoundingBox.Top * 100}%`, }} alt={celebrity.Name} />
                  <a target="_blank" href={`https://${celebrity.imdb}`}>{celebrity.Name}</a> - Confidence:{" "}
                  {celebrity.MatchConfidence.toFixed(2)}%
                  {checking ? "searching imbd..." : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>No celebrities recognized in the photo.</p>
          )}
        </div>
      )}
    </form>
  )
}
export default Results