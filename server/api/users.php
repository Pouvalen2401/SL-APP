<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $query = "SELECT * FROM users ORDER BY id DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO users (name, tics, face_descriptor, avatar_config) 
                  VALUES (:name, :tics, :face_descriptor, :avatar_config)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":tics", json_encode($data->tics));
        $stmt->bindParam(":face_descriptor", json_encode($data->faceDescriptor));
        $stmt->bindParam(":avatar_config", json_encode($data->avatarConfig));
        
        if($stmt->execute()) {
            echo json_encode(["message" => "User created", "id" => $db->lastInsertId()]);
        } else {
            echo json_encode(["message" => "Failed to create user"]);
        }
        break;
}
?>
