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
      return imbdUrl.replace("https://", "").replace("http://", "");
    } 
    if (face.Urls && face.Urls[0]) {
        let id = await fetchImdbId(face.Urls[0].split("/").pop());
        return `imdb.com/name/${id}`;

    }
    return null;
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    setImage(URL.createObjectURL(file));
    console.log("Selected file:", file);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageBytes = e.target.result.split(",")[1]; // Remove the base64 prefix
      const [response, message] = await recognise(imageBytes);
      setResult(response);
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
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
      <img src="https://cdn.mos.cms.futurecdn.net/CsvAuuLtsSQj2BBZypvaC7-1200-80.jpg.webp" height="100px" width="auto" style={{ position: "relative" }}/>
      <svg width="50" height="50" style={{ position: "absolute", top: 10, left: 60 }}>
        <rect width="50" height="50" style={{ fill: "rgba(255, 255, 255, 0.2)", stroke: "red", strokeWidth: 2 }} />
      </svg>
      </div>
      <div style={{ textAlign: "center" }}>
      <h2>Who's that actor?</h2>
      {(!result) ? "Identify actors using your smartphone camera. Take or upload a photo to begin" : null}
      <br></br>
      </div>
      <input type="file" accept="image/*" onChange={handlePhotoChange} />
      {loading ? "loading..." : null}
      {result && (
        <div style={{ marginTop: "20px" ,display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <img src={image} alt="Uploaded" style={{ maxHeight: "200px" }} />
          <h3>In this image:</h3>
          {result.CelebrityFaces && result.CelebrityFaces.length > 0 ? (
            <ul style={{textAlign: "center"}}>
              {result.CelebrityFaces.map((celebrity, index) => {
               const backgroundSize = (0.70 / celebrity.Face.BoundingBox.Width) * 100;
                return (
                <li key={celebrity.Name + index} style={{ margin: "10px auto", listStyleType: "none", textAlign: "left" }}>
                  <div
                    style={{
                      backgroundImage: `url("${image}")`,
                      backgroundPosition: `left -${(celebrity.Face.BoundingBox.Left - celebrity.Face.BoundingBox.Width/2) * backgroundSize}px top ${(celebrity.Face.BoundingBox.Top + celebrity.Face.BoundingBox.Height/2) * 100}%`,
                      backgroundSize: `${backgroundSize}%`,
                      border: "2px solid #666",
                      display: "inline-block",
                      width: "100px",
                      height: "100px",
                      verticalAlign: "middle",
                      marginRight: "10px",
                      boxShadow: "0 0 5px rgba(0,0,0,0.3)",
                      borderRadius: "8px",
                    
                    }}>
                   
                  </div>

                  <a target="_blank" href={`https://${celebrity.imdb}`}>{celebrity.Name}</a><span style={{ marginLeft: "5px", fontSize: "0.8em", color: "#666" }}>{celebrity.MatchConfidence.toFixed(0)}{"% Match"}</span>

                  {checking ? "searching imbd..." : null}
                </li>
              )})}
            </ul>
          ) : (
            <p>No celebrities recognized in the photo.</p>
          )}
        </div>
      )}
    </div>
  )
}
export default Results