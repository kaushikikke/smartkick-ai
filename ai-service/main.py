from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import mediapipe as mp
import numpy as np
import tempfile
import shutil
import math

app = FastAPI()

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mp_pose = mp.solutions.pose

@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):

    # Save uploaded video
    temp_video = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")

    with open(temp_video.name, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    cap = cv2.VideoCapture(temp_video.name)

    pose = mp_pose.Pose()

    previous_position = None
    total_distance = 0
    frame_count = 0
    movement_frames = 0

    coordinates = []

    left_zone = 0
    center_zone = 0
    right_zone = 0

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30

    while cap.isOpened():

        ret, frame = cap.read()

        if not ret:
            break

        frame_count += 1

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = pose.process(rgb)

        if results.pose_landmarks:

            left_hip = results.pose_landmarks.landmark[23]
            right_hip = results.pose_landmarks.landmark[24]

            hip_x = (left_hip.x + right_hip.x) / 2
            hip_y = (left_hip.y + right_hip.y) / 2

            current_position = (hip_x, hip_y)

            coordinates.append([hip_x, hip_y])

            # Zone detection
            if hip_x < 0.33:
                left_zone += 1
            elif hip_x < 0.66:
                center_zone += 1
            else:
                right_zone += 1

            if previous_position:

                distance = math.sqrt(
                    (hip_x - previous_position[0]) ** 2 +
                    (hip_y - previous_position[1]) ** 2
                )

                total_distance += distance

                if distance > 0.001:
                    movement_frames += 1

            previous_position = current_position

    cap.release()
    pose.close()

    # Convert to meters (demo scaling)
    scaling_factor = 50
    distance_meters = total_distance * scaling_factor

    total_time = frame_count / fps if fps > 0 else 1

    avg_speed = distance_meters / total_time if total_time > 0 else 0

    active_percent = (
        (movement_frames / frame_count) * 100
        if frame_count > 0 else 0
    )

    # -----------------------------
    # PERFORMANCE SCORE
    # -----------------------------

    performance_score = (
        (distance_meters * 0.4) +
        (avg_speed * 10 * 0.3) +
        (active_percent * 0.3)
    )

    performance_score = min(100, round(performance_score, 1))

    # -----------------------------
    # AI TACTICAL INSIGHT
    # -----------------------------

    insight = []

    if distance_meters > 1500:
        insight.append("Player covered very high distance showing excellent stamina.")
    elif distance_meters > 800:
        insight.append("Player maintained good movement across the pitch.")
    else:
        insight.append("Movement distance is relatively low suggesting limited involvement.")

    if avg_speed > 6:
        insight.append("High sprint speed detected indicating explosive runs.")
    elif avg_speed > 3:
        insight.append("Player maintained moderate running intensity.")
    else:
        insight.append("Movement speed is relatively slow.")

    if active_percent > 70:
        insight.append("Player remained active for most of the session.")
    elif active_percent > 40:
        insight.append("Player shows moderate activity levels.")
    else:
        insight.append("Player had limited active movement during the session.")

    # Zone insight
    dominant_zone = max(left_zone, center_zone, right_zone)

    if dominant_zone == left_zone:
        insight.append("Heatmap indicates strong presence on the left side of the pitch.")
    elif dominant_zone == right_zone:
        insight.append("Heatmap indicates strong presence on the right flank.")
    else:
        insight.append("Player movement concentrated mainly in the central midfield area.")

    tactical_insight = insight

    return {

        "performance_score": performance_score,

        "distance_meters": round(distance_meters, 2),

        "avg_speed_m_per_s": round(avg_speed, 2),

        "active_time_percent": round(active_percent, 2),

        "total_frames": frame_count,

        "video_duration_sec": round(total_time, 2),

        "coordinates": coordinates,

        "tactical_insight": tactical_insight
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)