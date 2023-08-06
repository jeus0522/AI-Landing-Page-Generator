"use client";
import { useChat } from "ai/react";
import { SetStateAction, useEffect, useRef, useState } from "react";
import Frame from "react-frame-component";
import dynamic from "next/dynamic";
import Image from "next/image";

enum DeviceSize {
  Mobile = "w-1/2",
  Tablet = "w-3/4",
  Desktop = "w-full",
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  const [iframeContent, setIframeContent] = useState("");
  const [deviceSize, setDeviceSize] = useState(DeviceSize.Desktop);
  const iframeRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [editingMode, setEditingMode] = useState(false);
  const [codeViewActive, setCodeViewActive] = useState(false);

  const appendToIframe = (content: any) => {
    if (iframeRef.current) {
      const iframeDocument = (iframeRef.current as HTMLIFrameElement)
        .contentDocument;
      if (iframeDocument) {
        const newNode = iframeDocument.createElement("div");
        newNode.innerHTML = content;
        newNode.querySelectorAll<HTMLElement>("*").forEach((element) => {
          element.addEventListener("mouseover", () => {
            element.classList.add("outline-blue"); // Blue border
          });
          element.addEventListener("mouseout", () => {
            element.style.outline = "none";
          });
          element.addEventListener("click", () => {
            setSelectedElement(element);
            setEditedContent(element.innerHTML);
          });
        });
        requestAnimationFrame(() => {
          iframeDocument.body.appendChild(newNode);
        });
      }
    }
  };

  useEffect(() => {
    const stream = new EventSource("/api/chat");
    stream.onmessage = (event) => {
      appendToIframe(event.data);
    };

    return () => stream.close();
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role !== "user") {
      setIframeContent(lastMessage.content);
    }
  }, [messages]);

  // Set the designMode property based on the editingMode state
  useEffect(() => {
	if (editingMode) {
		enableEditMode();
	} else{
		disableEditMode();
	}
  }, [editingMode]);
	
  const handleSave = () => {
    const element = document.createElement("a");
    const file = new Blob([iframeContent], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = fileName || "index.html";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    const completionInput = iframeContent;
  };

  // Create a map to store the listeners for each element
  const listenersMap = useRef<
    Map<HTMLElement, { mouseover: () => void; mouseout: () => void }>
  >(new Map());

  const disableEditMode = () => {
	  
	  if (iframeRef.current) {
	    const iframeDocument = (iframeRef.current as HTMLIFrameElement)
	      .contentDocument;
	    if (iframeDocument) {
	      iframeDocument
	        .querySelectorAll<HTMLElement>("*")
	        .forEach((element) => {
	          element.contentEditable = "false";
	  
	          // Get the listeners for the element from the map
	          const listeners = listenersMap.current.get(element);
	          if (listeners) {
	            // Remove the listeners
	            element.removeEventListener("mouseover", listeners.mouseover);
	            element.removeEventListener("mouseout", listeners.mouseout);
	            // Remove the element from the map
	            listenersMap.current.delete(element);
	          }
	        });
	    }
	  }
  };
 
  const enableEditMode = () => {
	  if (iframeRef.current) {
	    const iframeDocument = (iframeRef.current as HTMLIFrameElement)
	      .contentDocument;
	    if (iframeDocument) {
	      iframeDocument
	        .querySelectorAll<HTMLElement>("*")
	        .forEach((element) => {
	          element.contentEditable = "true";
	  
	          // Create the event listeners
	          const mouseoverListener = () => {
	            element.classList.add("outline-blue");
	            console.log("Mouseover event fired");
	          };
	          const mouseoutListener = () => {
	            console.log("Mouseout event fired");
	            element.classList.remove("outline-blue");
	          };
	  
	          // Add the listeners to the element
	          element.addEventListener("mouseover", mouseoverListener);
	          element.addEventListener("mouseout", mouseoutListener);
	  
	          // Store the listeners in the map
	          listenersMap.current.set(element, {
	            mouseover: mouseoverListener,
	            mouseout: mouseoutListener,
	          });
	        });
	    }
	  }
  }
 
  const handleEdit = () => {
    if (editingMode) {
      // Save the updated iframe content
      if (iframeRef.current) {
        const iframeDocument = (iframeRef.current as HTMLIFrameElement)
          .contentDocument;
        if (iframeDocument) {
          setIframeContent(iframeDocument.documentElement.innerHTML);
        }
      }
      // Disable editing mode by setting the contentEditable property of all elements to false and remove the event listeners
      disableEditMode();
    } else {
      // Enable editing mode by setting the contentEditable property of all elements to true and add event listeners
      enableEditMode();
    }
    setEditingMode(!editingMode);
  };

  const handleUpdate = () => {
    if (selectedElement) {
      selectedElement.innerHTML = editedContent;
      setSelectedElement(null);
      setEditedContent("");
      if (iframeRef.current) {
        const iframeDocument = (iframeRef.current as HTMLIFrameElement)
          .contentDocument;
        if (iframeDocument) {
          setIframeContent(iframeDocument.documentElement.innerHTML);
        }
      }
    }
  };
  
  return (
    <div className="flex flex-col w-full min-h-screen mx-auto px-4 md:px-16 lg:px-24 overflow-hidden items-center pt-24 pb-10 md:pt-32">
      <header className="w-full px-6 pt-4 absolute top-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 tracking-tight">
			<svg width="32" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
			    <path fill="#f43f5e" d="M96 63.38C142.49 27.25 201.55 7.31 260.51 8.81c29.58-.38 59.11 5.37 86.91 15.33c-24.13-4.63-49-6.34-73.38-2.45C231.17 27 191 48.84 162.21 80.87c5.67-1 10.78-3.67 16-5.86c18.14-7.87 37.49-13.26 57.23-14.83c19.74-2.13 39.64-.43 59.28 1.92c-14.42 2.79-29.12 4.57-43 9.59c-34.43 11.07-65.27 33.16-86.3 62.63c-13.8 19.71-23.63 42.86-24.67 67.13c-.35 16.49 5.22 34.81 19.83 44a53.27 53.27 0 0 0 37.52 6.74c15.45-2.46 30.07-8.64 43.6-16.33c11.52-6.82 22.67-14.55 32-24.25c3.79-3.22 2.53-8.45 2.62-12.79c-2.12-.34-4.38-1.11-6.3.3a203 203 0 0 1-35.82 15.37c-20 6.17-42.16 8.46-62.1.78c12.79 1.73 26.06.31 37.74-5.44c20.23-9.72 36.81-25.2 54.44-38.77a526.57 526.57 0 0 1 88.9-55.31c25.71-12 52.94-22.78 81.57-24.12c-15.63 13.72-32.15 26.52-46.78 41.38c-14.51 14-27.46 29.5-40.11 45.18c-3.52 4.6-8.95 6.94-13.58 10.16a150.7 150.7 0 0 0-51.89 60.1c-9.33 19.68-14.5 41.85-11.77 63.65c1.94 13.69 8.71 27.59 20.9 34.91c12.9 8 29.05 8.07 43.48 5.1c32.8-7.45 61.43-28.89 81-55.84c20.44-27.52 30.52-62.2 29.16-96.35c-.52-7.5-1.57-15-1.66-22.49c8 19.48 14.82 39.71 16.65 60.83c2 14.28.75 28.76-1.62 42.9c-1.91 11-5.67 21.51-7.78 32.43a165 165 0 0 0 39.34-81.07a183.64 183.64 0 0 0-14.21-104.64c20.78 32 32.34 69.58 35.71 107.48c.49 12.73.49 25.51 0 38.23A243.21 243.21 0 0 1 482 371.34c-26.12 47.34-68 85.63-117.19 108c-78.29 36.23-174.68 31.32-248-14.68A248.34 248.34 0 0 1 25.36 366A238.34 238.34 0 0 1 0 273.08v-31.34C3.93 172 40.87 105.82 96 63.38m222 80.33a79.13 79.13 0 0 0 16-4.48c5-1.77 9.24-5.94 10.32-11.22c-8.96 4.99-17.98 9.92-26.32 15.7z"/>
			</svg>
            <h1 className="font-bold text-xl">AI Landing Page Generator</h1>
          </div>
        </div>
      </header>
      {isLoading ? null : (
        <div className="relative pt-2 flex flex-col justify-center items-center">
          <svg width="100" height="100" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f43f5e" d="M96 63.38C142.49 27.25 201.55 7.31 260.51 8.81c29.58-.38 59.11 5.37 86.91 15.33c-24.13-4.63-49-6.34-73.38-2.45C231.17 27 191 48.84 162.21 80.87c5.67-1 10.78-3.67 16-5.86c18.14-7.87 37.49-13.26 57.23-14.83c19.74-2.13 39.64-.43 59.28 1.92c-14.42 2.79-29.12 4.57-43 9.59c-34.43 11.07-65.27 33.16-86.3 62.63c-13.8 19.71-23.63 42.86-24.67 67.13c-.35 16.49 5.22 34.81 19.83 44a53.27 53.27 0 0 0 37.52 6.74c15.45-2.46 30.07-8.64 43.6-16.33c11.52-6.82 22.67-14.55 32-24.25c3.79-3.22 2.53-8.45 2.62-12.79c-2.12-.34-4.38-1.11-6.3.3a203 203 0 0 1-35.82 15.37c-20 6.17-42.16 8.46-62.1.78c12.79 1.73 26.06.31 37.74-5.44c20.23-9.72 36.81-25.2 54.44-38.77a526.57 526.57 0 0 1 88.9-55.31c25.71-12 52.94-22.78 81.57-24.12c-15.63 13.72-32.15 26.52-46.78 41.38c-14.51 14-27.46 29.5-40.11 45.18c-3.52 4.6-8.95 6.94-13.58 10.16a150.7 150.7 0 0 0-51.89 60.1c-9.33 19.68-14.5 41.85-11.77 63.65c1.94 13.69 8.71 27.59 20.9 34.91c12.9 8 29.05 8.07 43.48 5.1c32.8-7.45 61.43-28.89 81-55.84c20.44-27.52 30.52-62.2 29.16-96.35c-.52-7.5-1.57-15-1.66-22.49c8 19.48 14.82 39.71 16.65 60.83c2 14.28.75 28.76-1.62 42.9c-1.91 11-5.67 21.51-7.78 32.43a165 165 0 0 0 39.34-81.07a183.64 183.64 0 0 0-14.21-104.64c20.78 32 32.34 69.58 35.71 107.48c.49 12.73.49 25.51 0 38.23A243.21 243.21 0 0 1 482 371.34c-26.12 47.34-68 85.63-117.19 108c-78.29 36.23-174.68 31.32-248-14.68A248.34 248.34 0 0 1 25.36 366A238.34 238.34 0 0 1 0 273.08v-31.34C3.93 172 40.87 105.82 96 63.38m222 80.33a79.13 79.13 0 0 0 16-4.48c5-1.77 9.24-5.94 10.32-11.22c-8.96 4.99-17.98 9.92-26.32 15.7z"/>
          </svg>
          <div className="text-center sm:w-11/12 md:w-[800px]">
            <h2 className="text-5xl font-bold text-ellipsis tracking-tight">
              Create landing page easily{" "}
              <span className="font-normal">with AI</span>
            </h2>
            <h3 className="text-lg text-gray-700 mt-4 tracking-tight">
              A Best Landing Page Generator. With AI, creating a landing
              page is not only easy but also efficient, precise, and tailored to
              your needs.
            </h3>
          </div>
        </div>
      )}
      <div className="flex flex-col w-full justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className="mb-4 w-full sm:w-11/12 md:w-[800px] mx-auto"
        >
          <input
            className={`w-full p-2 mb-3 mt-3 focus:outline-0 focus:shadow-lg focus:border-blue-400 transition-shadow border rounded-full text-ellipsis border-gray-200 px-4 ${
              isLoading ? "rounded-xl" : "shadow-sm"
            }`}
            value={input}
            // update placeholder when the GPT is typing
            placeholder={isLoading ? "Generating... " : "Say something..."}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          {isLoading ? null : (
            <p className="text-xs ml-4 font-medium text-gray-500">
              <b>Eg:</b> A landing page for Medical website
            </p>
          )}
        </form>
      </div>

      {editingMode && selectedElement && (
        <div className="absolute z-50">
          <p>Edit the selected element:</p>
          <input
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <button onClick={handleUpdate}>Update</button>
        </div>
      )}
      {iframeContent && (
        <div className="flex flex-col items-center h-2/3 w-full">
          <div className={`border border-gray-100 rounded-2xl shadow-xl p-4 ${deviceSize}`}>
            <div className="flex items-center justify-between p-3 border-b lg:px-12 sticky top-4 z-10">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center space-x-2 bg-gray-200 rounded-xl mx-8 py-1 px-2">
                  <span className="text-black">ailandingpagegenerator.com</span>
                  {isLoading && <span className="ml-4 animate-spin">
					<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					    <path fill="none" stroke="#f43f5e" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 14a1 1 0 1 0 2 0a1 1 0 0 0-2 0Zm6-2a1 1 0 1 0 2 0a1 1 0 0 0-2 0Zm6-2a1 1 0 1 0 2 0a1 1 0 0 0-2 0Z"/>
					</svg>
				  </span>}
                  <button
                    className="ml-4 hidden md:flex"
                    onClick={() => setDeviceSize(DeviceSize.Mobile)}
                  >
                    <svg width="20" height="20" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#405866" d="M47.873 0H16.124a5.082 5.082 0 0 0-5.08 5.079v53.845a5.084 5.084 0 0 0 5.08 5.079h31.749a5.088 5.088 0 0 0 5.083-5.079V5.087A5.085 5.085 0 0 0 47.873.008"/>
                        <path fill="#85cfea" d="M44.579 3.876h-25.16a4.03 4.03 0 0 0-4.03 4.02v42.667a4.028 4.028 0 0 0 4.03 4.02h25.16c2.22 0 4.02-1.81 4.02-4.02V7.892c0-2.22-1.805-4.02-4.02-4.02"/>
                        <path fill="#28a6de" d="M31.3 3.876H19.425a4.03 4.03 0 0 0-4.03 4.02v42.667a4.028 4.028 0 0 0 4.03 4.02h25.16c.813 0 1.564-.249 2.196-.659C36.084 39.99 30.358 21.259 31.303 3.874"/>
                        <path fill="#cbd5dc" d="M35.3 59.39c0 1.817-1.476 3.298-3.297 3.298s-3.297-1.48-3.297-3.298s1.476-3.298 3.297-3.298s3.297 1.48 3.297 3.298m-12.705 0a2.412 2.412 0 1 1-4.823.003a2.412 2.412 0 0 1 4.823-.003m18.815 0a2.412 2.412 0 1 0 4.822 0a2.41 2.41 0 0 0-4.822 0"/>
                    </svg>
                  </button>
                  <button
                    className="ml-4 hidden md:flex"
                    onClick={() => setDeviceSize(DeviceSize.Tablet)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#000000" d="M2 20q-.825 0-1.413-.588T0 18h4q-.825 0-1.413-.588T2 16V5q0-.825.588-1.413T4 3h16q.825 0 1.413.588T22 5v11q0 .825-.588 1.413T20 18h4q0 .825-.588 1.413T22 20H2Zm10-1q.425 0 .713-.288T13 18q0-.425-.288-.713T12 17q-.425 0-.713.288T11 18q0 .425.288.713T12 19Zm-8-3h16V5H4v11Zm0 0V5v11Z"/>
                    </svg>
                  </button>
                  <button
                    className="ml-4 hidden md:flex"
                    onClick={() => setDeviceSize(DeviceSize.Desktop)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#000000" d="M14 18v2l2 1v1H8l-.004-.996L10 20v-2H2.992A.998.998 0 0 1 2 16.992V4.008C2 3.451 2.455 3 2.992 3h18.016c.548 0 .992.449.992 1.007v12.985c0 .557-.455 1.008-.992 1.008H14ZM4 5v9h16V5H4Z"/>
                    </svg>
                  </button>
                  <button
                    className="ml-4"
                    onClick={() => {
						setCodeViewActive(!codeViewActive);
						if (codeViewActive == true) {
							disableEditMode();
						}
					}}
                  >
                    {codeViewActive ? "Preview" : "Code"}
                  </button>
                </div>
              </div>
              <div></div>
              <div className="flex justify-end space-x-4">
                <button onClick={handleSave}>
                  <span role="img" aria-label="paper-plane">
                    <svg width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 22c-9 1-8-10 0-9C6 2 23 2 22 10c10-3 10 13 1 12m-12 4l5 4l5-4m-5-10v14"/>
                    </svg>
                  </span>
                </button>

                {!isLoading && !codeViewActive && iframeContent && (
                  <button onClick={handleEdit} className="ml-4">
                    {editingMode ? "Save" : "Edit"}
                  </button>
                )}
              </div>
            </div>
            <div className="h-[96rem]">
              <Frame
                ref={iframeRef}
                sandbox="allow-same-origin allow-scripts"
                style={{ width: "100%", height: "100%" }}
              >
                {codeViewActive ? (
                  <pre>{iframeContent}</pre>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: iframeContent }} />
                )}
              </Frame>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
