<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "compass"; // تم التعديل حسب صورتك

$conn = mysqli_connect($host, $user, $pass, $dbname);

if (!$conn) {
    die("خطأ في الاتصال: " . mysqli_connect_error());
}
?>