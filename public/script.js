document.getElementById("voiceNoteForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("phoneNumber", document.getElementById("phoneNumber").value);
    formData.append("audioFile", document.getElementById("audioFile").files[0]);

    const response = await fetch("/send-voice-note", {
        method: "POST",
        body: formData,
    });
    const result = await response.json();
    alert(result.message);
};
