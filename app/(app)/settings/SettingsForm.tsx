"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";

export function SettingsForm() {
  return (
    <Card>
      <CardHeader>การตั้งค่าแอป</CardHeader>
      <CardBody>
        <p className="text-default-500 text-sm">
          การตั้งค่าระดับระบบ (Site Setting) สามารถเพิ่มในภายหลัง
        </p>
      </CardBody>
    </Card>
  );
}
