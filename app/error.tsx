"use client";

import { useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-lg font-semibold">เกิดข้อผิดพลาด</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-default-500">
            เกิดข้อผิดพลาดขณะโหลดหน้านี้ กรุณาลองใหม่อีกครั้ง
          </p>
          <Button color="primary" variant="solid" onPress={() => reset()}>
            ลองอีกครั้ง
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
