from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
import joblib
import os
from datetime import datetime, timedelta

app = FastAPI(title="Vehicle Tracking ML Service", version="1.0.0")

# Models
class GPSData(BaseModel):
    vehicle_id: int
    latitude: float
    longitude: float
    speed: float = None
    heading: float = None
    timestamp: str

class RouteData(BaseModel):
    vehicle_id: int
    points: List[Dict[str, Any]]

class MaintenanceData(BaseModel):
    vehicle_id: int
    mileage: float
    engine_hours: float
    fuel_consumption: float
    last_service_date: str

# Load or train models
anomaly_model = None
maintenance_model = None
route_model = None

def load_models():
    global anomaly_model, maintenance_model, route_model

    # Anomaly detection model (Isolation Forest)
    if os.path.exists('models/anomaly_model.pkl'):
        anomaly_model = joblib.load('models/anomaly_model.pkl')
    else:
        anomaly_model = IsolationForest(contamination=0.1, random_state=42)

    # Maintenance prediction model (placeholder - would need real training data)
    if os.path.exists('models/maintenance_model.pkl'):
        maintenance_model = joblib.load('models/maintenance_model.pkl')
    else:
        # Simple rule-based for demo
        maintenance_model = {"thresholds": {"mileage": 10000, "engine_hours": 500}}

    # Route optimization model (K-means clustering)
    if os.path.exists('models/route_model.pkl'):
        route_model = joblib.load('models/route_model.pkl')
    else:
        route_model = KMeans(n_clusters=5, random_state=42)

@app.on_event("startup")
async def startup_event():
    os.makedirs('models', exist_ok=True)
    load_models()

@app.get("/")
async def root():
    return {"message": "Vehicle Tracking ML Service"}

@app.post("/anomaly-detection")
async def detect_anomalies(gps_data: List[GPSData]):
    """
    Detect anomalous vehicle behavior from GPS data
    """
    try:
        # Convert to DataFrame
        df = pd.DataFrame([data.dict() for data in gps_data])

        # Feature engineering
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['speed'] = df['speed'].fillna(0)

        # Prepare features for anomaly detection
        features = df[['latitude', 'longitude', 'speed', 'hour']].values

        # Fit and predict anomalies
        if len(features) > 10:  # Need minimum data
            anomaly_model.fit(features)
            predictions = anomaly_model.predict(features)
            df['anomaly'] = predictions == -1  # -1 indicates anomaly
        else:
            df['anomaly'] = False

        # Save model
        joblib.dump(anomaly_model, 'models/anomaly_model.pkl')

        anomalies = df[df['anomaly']].to_dict('records')

        return {
            "anomalies": anomalies,
            "total_points": len(gps_data),
            "anomaly_count": len(anomalies)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

@app.post("/predictive-maintenance")
async def predict_maintenance(data: MaintenanceData):
    """
    Predict maintenance needs based on vehicle data
    """
    try:
        # Simple rule-based prediction for demo
        thresholds = maintenance_model.get("thresholds", {})

        predictions = []

        if data.mileage > thresholds.get("mileage", 10000):
            predictions.append({
                "type": "mileage_service",
                "urgency": "high",
                "message": "Vehicle due for mileage-based service"
            })

        if data.engine_hours > thresholds.get("engine_hours", 500):
            predictions.append({
                "type": "engine_service",
                "urgency": "medium",
                "message": "Engine hours service recommended"
            })

        # Calculate next service date (simplified)
        last_service = datetime.fromisoformat(data.last_service_date.replace('Z', '+00:00'))
        next_service = last_service + timedelta(days=90)  # 3 months

        return {
            "vehicle_id": data.vehicle_id,
            "predictions": predictions,
            "next_service_date": next_service.isoformat(),
            "recommendations": [
                "Check oil levels",
                "Inspect brakes",
                "Verify tire pressure"
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Maintenance prediction failed: {str(e)}")

@app.post("/route-optimization")
async def optimize_route(route_data: RouteData):
    """
    Optimize route based on historical data and clustering
    """
    try:
        # Extract coordinates
        points = route_data.points
        coordinates = np.array([[p['latitude'], p['longitude']] for p in points])

        if len(coordinates) < 5:
            return {"optimized_route": points, "message": "Insufficient data for optimization"}

        # Cluster points to find optimal path
        clusters = route_model.fit_predict(coordinates)

        # Simple optimization: sort by cluster and then by proximity
        optimized_points = []
        for cluster_id in np.unique(clusters):
            cluster_points = [p for p, c in zip(points, clusters) if c == cluster_id]
            optimized_points.extend(cluster_points)

        # Save model
        joblib.dump(route_model, 'models/route_model.pkl')

        return {
            "original_points": len(points),
            "optimized_route": optimized_points,
            "estimated_savings": "15-20%",  # Placeholder
            "clusters": len(np.unique(clusters))
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route optimization failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}