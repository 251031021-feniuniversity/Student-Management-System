<?php
/* NoticeController */
class NoticeController
{
    public static function notice_add($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!can($u, 'can_notice')) fail('No notice permission', 403);
        $title = v($in, 'title', 255); $body = v($in, 'body', 5000); $pri = v($in, 'priority', 10);
        if ($title === '' || $body === '') fail('Title and content required');
        if (!in_array($pri, ['low', 'medium', 'high'], true)) $pri = 'medium';
        ex('INSERT INTO notices (title,body,priority,by_name) VALUES (?,?,?,?)', [$title, $body, $pri, $u['name']]);
        out(['ok' => true]);
    }

    public static function notice_delete($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        ex('DELETE FROM notices WHERE id=?', [(int)($in['id'] ?? 0)]);
        out(['ok' => true]);
    }

}
