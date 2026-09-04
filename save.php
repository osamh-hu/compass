<?php
include 'connect.php';

$angle = $_POST['angle'] ?? 0;
$direction = $_POST['direction'] ?? '';
$location = $_POST['location'] ?? ''; // هذا هو المهم لاستقبال "Yemen"

if (!empty($direction)) {
    $sql = "INSERT INTO compass_logs (angle, direction, location) VALUES ('$angle', '$direction', '$location')";
    if (mysqli_query($conn, $sql)) {
        echo "تم الحفظ بنجاح!";
    } else {
        echo "خطأ: " . mysqli_error($conn);
    }
}
?>