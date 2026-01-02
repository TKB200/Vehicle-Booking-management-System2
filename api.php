<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
        $stmt->execute([$data['userId']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && $user['password'] === $data['password']) {
            unset($user['password']); // Don't send password back
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
        break;

    case 'register':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("INSERT INTO users (user_id, password, name, phone, role) VALUES (?, ?, ?, ?, 'employee')");
            $stmt->execute([$data['userId'], $data['password'], $data['name'], $data['phone']]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'User ID already exists']);
        }
        break;

    case 'get_state':
        $vehicles = $pdo->query("SELECT * FROM vehicles")->fetchAll(PDO::FETCH_ASSOC);
        $bookings = $pdo->query("SELECT * FROM bookings")->fetchAll(PDO::FETCH_ASSOC);
        $users = $pdo->query("SELECT user_id, name, phone, role FROM users")->fetchAll(PDO::FETCH_ASSOC);

        // Format users list as an object keyed by user_id to match JS expectations
        $usersMap = [];
        foreach ($users as $u) {
            $usersMap[$u['user_id']] = $u;
        }

        echo json_encode([
            'success' => true,
            'vehicles' => $vehicles,
            'bookings' => $bookings,
            'users' => $usersMap
        ]);
        break;

    case 'book_vehicle':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $stmt = $pdo->prepare("INSERT INTO bookings (vehicle_id, user_id, pickup_date, pickup_time, return_date, return_time) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['vehicleId'],
                $data['userId'],
                $data['pickupDate'],
                $data['pickupTime'],
                $data['returnDate'],
                $data['returnTime']
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'toggle_maintenance':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("SELECT status FROM vehicles WHERE id = ?");
        $stmt->execute([$data['vehicleId']]);
        $current = $stmt->fetchColumn();

        $newStatus = ($current === 'Maintenance') ? 'Available' : 'Maintenance';

        $stmt = $pdo->prepare("UPDATE vehicles SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $data['vehicleId']]);
        echo json_encode(['success' => true, 'newStatus' => $newStatus]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
        break;
}
?>