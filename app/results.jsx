"use client"
import React, { useState } from "react";
import recognise from "./recognise";

const Results = () => {
  const [result, setResult] = useState(null);
  const [image, setImage] = useState(null);
  const [dimensions, setDimensions] = useState({ naturalHeight: 0, naturalWidth: 0 });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchUrls = async (qid) => {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      // Navigate to the P345 property
      const imdbId = data.entities[qid].claims.P345[0].mainsnak.datavalue.value;
      const wiki = data.entities[qid].sitelinks.enwiki.url;
      return { imdbId, wiki };
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  const handleImageload = (e) => {
    const { naturalHeight, naturalWidth } = e.target;
    setDimensions({ naturalHeight, naturalWidth });
  };

  const getImdbData = async (face) => {
    if (face.Urls && face.Urls[0]) {
      let imdbData = await fetchUrls(face.Urls[0].split("/").pop());
      return imdbData ? { imdb: `www.imdb.com/name/${imdbData.imdbId}`, wiki: imdbData.wiki } : {};

    }
    return {};
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    setImage(URL.createObjectURL(file));
    console.log("Selected file:", file);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      setResult(null);
      const imageBytes = e.target.result.split(",")[1]; // Remove the base64 prefix
      const [response, message] = await recognise(imageBytes);
      setResult(response);
      let updatedResponse = response;
      setLoading(false);
      setChecking(true);
      if (updatedResponse.CelebrityFaces) {
        let newCelebFaces = [];
        for (let i = 0; i < updatedResponse.CelebrityFaces.length; i++) {
          const imdbData = await getImdbData(updatedResponse.CelebrityFaces[i]);
          newCelebFaces.push({
            ...updatedResponse.CelebrityFaces[i],
            ...imdbData
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
        <img src="https://cdn.mos.cms.futurecdn.net/CsvAuuLtsSQj2BBZypvaC7-1200-80.jpg.webp" height="100px" width="auto" style={{ position: "relative" }} />
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

      {(
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {image && <img onLoad={handleImageload} src={image} alt="Uploaded" style={{ maxHeight: "200px" }} />}
          {result ? <h4>In this image:</h4> : null}
          {loading ? <p>Analyzing photo...</p> : null}
          {result && result.CelebrityFaces && result.CelebrityFaces.length > 0 ? (
            <ul style={{ textAlign: "center" }}>
              {result.CelebrityFaces.map((celebrity, index) => {
                const sizeOfFace = 0.5; 
                const viewBoxSize = 100;
                const sizeOfFacePx = viewBoxSize * sizeOfFace ;
                const backgroundSize = (1 / celebrity.Face.BoundingBox.Width) *  sizeOfFacePx ;
                const backgroundWidthOffset = (celebrity.Face.BoundingBox.Left * backgroundSize - sizeOfFacePx/2);
                const heightOffset = (celebrity.Face.BoundingBox.Top * backgroundSize ) * (dimensions.naturalHeight / dimensions.naturalWidth)- (sizeOfFacePx/2);

                return (
                  <li key={celebrity.Name + index} style={{ margin: "10px auto", listStyleType: "none", textAlign: "left" }}>
                    <div
                      style={{
                        backgroundImage: `url("${image}")`,
                        backgroundPosition: `left -${backgroundWidthOffset}px top -${heightOffset}px`,
                        backgroundSize: `${backgroundSize}%`,
                        border: "2px solid #666",
                        display: "inline-block",
                        width: `${viewBoxSize}px`,
                        height: `${viewBoxSize}px`,
                        verticalAlign: "middle",
                        marginRight: "10px",
                        boxShadow: "0 0 5px rgba(0,0,0,0.3)",
                        borderRadius: "8px",

                      }}>

                    </div>
                    {checking ? celebrity.Name :
                      <div style={{ display: "inline-block", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-block" }}>
                          <span><a style={{ fontWeight: "bold", fontSize: "1.25em" }} target="_blank" href={`https://${celebrity.imdb}`}>{celebrity.Name}</a> <span style={{ marginLeft: "5px", fontSize: "0.8em", color: "#666" }}>{celebrity.MatchConfidence.toFixed(0)}{"% Match"}</span></span>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "5px", fontSize: "0.9em", color: "#666" }} ><span>More Info: </span>
                          <a href={`https://${celebrity.imdb}`} target="_blank">IMDB</a>

                          <a target="_blank" href={celebrity.wiki}>Wikipedia</a>
                        </div>
                      </div>

                    }

                  </li>
                )
              })}
            </ul>
          ) :
            null
          }
        </div>
      )}
    </div>
  )
}
export default Results