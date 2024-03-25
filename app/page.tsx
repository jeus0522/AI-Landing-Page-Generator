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
            <h1 className="font-bold text-xl">
				<a href="https://ailandingpagegenerator.com">AI Landing Page Generator</a>
			</h1>
          </div>
		  <div className="flex items-center hidden md:block lg:block text-black">
		      <a href="#contact" className="text font-semibold mr-1 md:mr-4 lg:mr-4">Contact</a>
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
				<div className="flex gap-2 flex-wrap">
					<div
						className="cursor-pointer mt-2 w-full h-10 rounded-full flex justify-center items-center bg-gradient-to-r from-teal-200 to-yellow-200 via-blue-100 ">
						✨
						<a className="ml-2 text-sm text-slate-900" target="_blank"
						   href="https://www.disneyaiposter.com/apps/ps2-filter">Generate PS2 Filter Photos</a>
					</div>
					<div
						className="cursor-pointer mt-2 w-full h-10 rounded-full flex justify-center items-center bg-gradient-to-r from-yellow-200 via-green-200 to-blue-200">
						<svg width="28" height="28" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
							<path fill="#f4aa41"
								  d="m24.473 15.158l-5.08 1.936l-7.296 7.9l-4.138 10.501l1.291 5.34c1.255 3.792 3.336 6.434 7.063 9.251L19 47.502s3.822 7.71 10.739 8.96c0 0 10.261 1.936 15.594-.877c1.49-.785 2.515-1.829 3.293-2.593c2.07-2.035 3.033-3.52 4.54-5.24s1.67 1.808 1.67 1.808l1.839-.056l5.017-7.23l2.003-5.07l-.021-4.254l-2.174-5.615l-4.833-7.416s-2.637-4.256-8.167-3.917c0 0-6.5-4.833-11.833-4.083s-3.61-.677-12.194 3.24Z"/>
							<path fill="#ea5a47"
								  d="m36 46.732l-3.083 2.417h-2.5l.524 3.89l.421 3.015l.805 2.345l2.833 1.5l4.583-.583l.86-2.204l.701-4.178l.773-3.618l-2 .25L36 46.732z"/>
							<path fill="#3f3f3f"
								  d="m32.5 36.919l-1.583 3.75l2.166 1.25l1.25.5l4.334.167l2.916-2.25l-1.75-3.25l-7.333-.167z"/>
							<path
								d="M29.506 30.109s-1.805 1.242-2.748.668a2 2 0 0 1 2.08-3.417c.943.575.668 2.749.668 2.749Z"/>
							<path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
								  d="M33.109 37.006h6.146a1 1 0 0 1 .92.609l1.158 2.724l-2.18 1.146a1 1 0 0 1-1.456-.754m-2.937.032a1 1 0 0 1-1.364.747l-2.313-.952l1.09-2.903a1 1 0 0 1 .936-.649m-2.673 13.021s-.718 8.793 3.008 9.937c2.645.813 5.15.533 6.062-.25c.875-.75 2.632-4.474 1.827-9.687"/>
							<path
								d="M44.264 30.109s1.805 1.242 2.748.668a2 2 0 0 0-2.08-3.417c-.944.575-.668 2.749-.668 2.749Z"/>
							<path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
								  d="M25.625 42.84c-.475 3.602 2.234 5.75 4.284 6.84a3.415 3.415 0 0 0 3.718-.317l2.58-2.024l2.582 2.024a3.416 3.416 0 0 0 3.717.318c2.05-1.091 4.76-3.24 4.285-6.842"/>
							<path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
								  d="M19.95 28.357c-2.316 5.16-.507 13.025.12 15.376a1.98 1.98 0 0 1-.127 1.363l-1.988 4.194c-.623 1.315-2.393 1.553-3.33.44c-3.193-3.786-8.559-11.39-6.55-16.685c7.063-18.61 15.869-18.143 15.869-18.143c2.845-1.934 13.104-6.938 24.812.875c0 0 8.632-1.718 14.938 16.937c1.803 5.337-3.43 12.867-6.551 16.645c-.931 1.127-2.716.893-3.342-.428l-1.975-4.165a1.978 1.978 0 0 1-.127-1.363c.628-2.351 2.436-10.216.12-15.376"/>
							<path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
								  d="M52.63 46.463s-3.077 6.721-7.804 8.271m-25.389-7.765s3.078 6.082 7.805 7.632m8.966-7.262v-3.03"/>
						</svg>
						<a className="ml-2 text-sm text-slate-900" href="https://www.disneyaiposter.com" target="_blank">Generate Your
							Disney AI Poster</a>
					</div>
				</div>
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
							<div
								className="flex items-center justify-center space-x-2 bg-gray-200 rounded-xl mx-8 py-1 px-2">
								<span className="text-black hidden md:block lg:block">ailandingpagegenerator.com</span>
								{isLoading && <span className="ml-4 animate-spin">
					<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					    <path fill="none" stroke="#f43f5e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
							  d="M5 14a1 1 0 1 0 2 0a1 1 0 0 0-2 0Zm6-2a1 1 0 1 0 2 0a1 1 0 0 0-2 0Zm6-2a1 1 0 1 0 2 0a1 1 0 0 0-2 0Z"/>
					</svg>
				  </span>}
								<button
									className="ml-4 hidden md:flex"
									onClick={() => setDeviceSize(DeviceSize.Mobile)}
								>
									<svg width="20" height="20" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
										<path fill="#405866"
											  d="M47.873 0H16.124a5.082 5.082 0 0 0-5.08 5.079v53.845a5.084 5.084 0 0 0 5.08 5.079h31.749a5.088 5.088 0 0 0 5.083-5.079V5.087A5.085 5.085 0 0 0 47.873.008"/>
										<path fill="#85cfea"
											  d="M44.579 3.876h-25.16a4.03 4.03 0 0 0-4.03 4.02v42.667a4.028 4.028 0 0 0 4.03 4.02h25.16c2.22 0 4.02-1.81 4.02-4.02V7.892c0-2.22-1.805-4.02-4.02-4.02"/>
										<path fill="#28a6de"
											  d="M31.3 3.876H19.425a4.03 4.03 0 0 0-4.03 4.02v42.667a4.028 4.028 0 0 0 4.03 4.02h25.16c.813 0 1.564-.249 2.196-.659C36.084 39.99 30.358 21.259 31.303 3.874"/>
										<path fill="#cbd5dc"
											  d="M35.3 59.39c0 1.817-1.476 3.298-3.297 3.298s-3.297-1.48-3.297-3.298s1.476-3.298 3.297-3.298s3.297 1.48 3.297 3.298m-12.705 0a2.412 2.412 0 1 1-4.823.003a2.412 2.412 0 0 1 4.823-.003m18.815 0a2.412 2.412 0 1 0 4.822 0a2.41 2.41 0 0 0-4.822 0"/>
									</svg>
								</button>
								<button
									className="ml-4 hidden md:flex"
									onClick={() => setDeviceSize(DeviceSize.Tablet)}
								>
									<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path fill="#000000"
											  d="M2 20q-.825 0-1.413-.588T0 18h4q-.825 0-1.413-.588T2 16V5q0-.825.588-1.413T4 3h16q.825 0 1.413.588T22 5v11q0 .825-.588 1.413T20 18h4q0 .825-.588 1.413T22 20H2Zm10-1q.425 0 .713-.288T13 18q0-.425-.288-.713T12 17q-.425 0-.713.288T11 18q0 .425.288.713T12 19Zm-8-3h16V5H4v11Zm0 0V5v11Z"/>
									</svg>
								</button>
								<button
									className="ml-4 hidden md:flex"
									onClick={() => setDeviceSize(DeviceSize.Desktop)}
								>
									<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path fill="#000000"
											  d="M14 18v2l2 1v1H8l-.004-.996L10 20v-2H2.992A.998.998 0 0 1 2 16.992V4.008C2 3.451 2.455 3 2.992 3h18.016c.548 0 .992.449.992 1.007v12.985c0 .557-.455 1.008-.992 1.008H14ZM4 5v9h16V5H4Z"/>
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
                        <path fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
							  d="M9 22c-9 1-8-10 0-9C6 2 23 2 22 10c10-3 10 13 1 12m-12 4l5 4l5-4m-5-10v14"/>
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
            <div className="h-[96rem] flex-grow">
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
	  <div className="text-black pt-10 mt-[460px] md:mr-[60%]">
	  		<div id="contact" className="text-black pt-4">
	  		  <div className="text-2xl">Contact</div>
	  		  <div className="flex justify-start items-center mb-2 space-y-2 mt-2 flex-wrap">
	  			<a href="https://github.com/JustAIGithub/AI-Landing-Page-Generator" className="text-gray cursor-pointer mr-4">
	  				<svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
	  				    <path fill="#000000" d="M12 2.247a10 10 0 0 0-3.162 19.487c.5.088.687-.212.687-.475c0-.237-.012-1.025-.012-1.862c-2.513.462-3.163-.613-3.363-1.175a3.636 3.636 0 0 0-1.025-1.413c-.35-.187-.85-.65-.013-.662a2.001 2.001 0 0 1 1.538 1.025a2.137 2.137 0 0 0 2.912.825a2.104 2.104 0 0 1 .638-1.338c-2.225-.25-4.55-1.112-4.55-4.937a3.892 3.892 0 0 1 1.025-2.688a3.594 3.594 0 0 1 .1-2.65s.837-.262 2.75 1.025a9.427 9.427 0 0 1 5 0c1.912-1.3 2.75-1.025 2.75-1.025a3.593 3.593 0 0 1 .1 2.65a3.869 3.869 0 0 1 1.025 2.688c0 3.837-2.338 4.687-4.563 4.937a2.368 2.368 0 0 1 .675 1.85c0 1.338-.012 2.413-.012 2.75c0 .263.187.575.687.475A10.005 10.005 0 0 0 12 2.247Z"/>
	  				</svg>
	  			</a>
	  			<a href="https://twitter.com/AUDI_GUZZ" className="text-gray cursor-pointer mr-4">
	  				<svg width="26" height="26" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
	  				    <path fill="#1d9bf0" d="M114.896 37.888c.078 1.129.078 2.257.078 3.396c0 34.7-26.417 74.72-74.72 74.72v-.02A74.343 74.343 0 0 1 0 104.21c2.075.25 4.16.375 6.25.38a52.732 52.732 0 0 0 32.615-11.263A26.294 26.294 0 0 1 14.331 75.09c3.937.76 7.993.603 11.857-.453c-12.252-2.475-21.066-13.239-21.066-25.74v-.333a26.094 26.094 0 0 0 11.919 3.287C5.5 44.139 1.945 28.788 8.913 16.787a74.535 74.535 0 0 0 54.122 27.435a26.277 26.277 0 0 1 7.598-25.09c10.577-9.943 27.212-9.433 37.154 1.139a52.696 52.696 0 0 0 16.677-6.376A26.359 26.359 0 0 1 112.92 28.42A52.227 52.227 0 0 0 128 24.285a53.35 53.35 0 0 1-13.104 13.603z"/>
	  				</svg>
	  			</a>
	  			<a href="https://aicodeconvert.com" className="text-black cursor-pointer rounded-full mr-4">
	  				<div
	  					className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
	  					<svg width="20" height="20" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
	  					    <path fill="#3b82f6" d="M516 673c0 4.4 3.4 8 7.5 8h185c4.1 0 7.5-3.6 7.5-8v-48c0-4.4-3.4-8-7.5-8h-185c-4.1 0-7.5 3.6-7.5 8v48zm-194.9 6.1l192-161c3.8-3.2 3.8-9.1 0-12.3l-192-160.9A7.95 7.95 0 0 0 308 351v62.7c0 2.4 1 4.6 2.9 6.1L420.7 512l-109.8 92.2a8.1 8.1 0 0 0-2.9 6.1V673c0 6.8 7.9 10.5 13.1 6.1zM880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"/>
	  					</svg>
	  					<p className="ml-2">AICodeConvert</p>
	  				</div>
	  			</a>
	  		  </div>
	  		  <div>
	  			Mail: enqueueit@gmail.com
	  		  </div>
	  		</div>
	  		<div id="friendlyLink" className="mt-4">
	  			<div className="text-2xl">Friendly Link</div>
				<div className="flex justify-start items-center mb-2 space-y-2 mt-2 flex-wrap">
					<a href="https://aipage.dev" rel="nofollow" className="text-black cursor-pointer rounded-full mr-4">
						<div
							className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
							<p className="">AI Page</p>
						</div>
					</a>
					<a href="https://www.geminiprochat.com" className="text-black cursor-pointer rounded-full mr-4">
						<div
							className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
							<p className="">Gemini Pro Chat</p>
						</div>
					</a>
					<a href="https://chatgptgratuito.net" className="text-black cursor-pointer rounded-full mr-4">
						<div
							className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
							<p className="">ChatGpt Português</p>
						</div>
					</a>
					<a href="http://www.cutout.pro/" className="text-black cursor-pointer rounded-full mr-4">
						<div
							className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
							<p className="">AI Photo Editor</p>
						</div>
					</a>
					<a href="https://twidropper.com" className="text-black cursor-pointer rounded-full mr-4">
						<div
							className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
							<p className="">Twitter動画保存</p>
						</div>
					</a>
					<a href="https://randomlettergenerator.org" className="text-black cursor-pointer rounded-full mr-4">
						<div
							className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
							<p className="">Random Letter Generator</p>
						</div>
					</a>
					<a href="https://crontab.online" className="text-black cursor-pointer rounded-full mr-4">
						<div
							className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
							<p className="">Crontab Online Generator</p>
						</div>
					</a>
					<a href="https://www.disneyaiposter.com" className="text-black cursor-pointer rounded-full mr-4">
						<div
							className="items-center flex text-sm font-medium justify-center py-2 px-4 border rounded-full">
							<p className="">Disney AI Poster</p>
						</div>
					</a>
				</div>
			</div>
	  </div>
	</div>
  );
}
