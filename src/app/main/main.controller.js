export class MainController {
  constructor (toastr, DataService, $log, webSocketFactory, $scope) {
    'ngInject';

    $scope.locationName = 'Tjuna Toilet';
    $scope.averageTime = 'No data';
    $scope.status = false;
    $scope.statusMsg = 'No data';

    // listen to websockets
    webSocketFactory.on('connect', () => {
      $log.log('yo im connected');
    });

    webSocketFactory.on('location', (data) => {
      let type = 'websocket';
      this.determineStatus(data, type);
      let average = Math.round((data.data.average_duration / 60));
      $scope.averageTime = average;
    });

    webSocketFactory.on('visit', (data) => {
      this.fillGraph(data);
    });

    // check the toilet status
    this.determineStatus = (data, type) => {
      if (type == 'api') {
        if (data.data.occupied) {
          this.status = true;
          this.toggleStatusMessages();

        } else {
          this.status = false;
          this.toggleStatusMessages();
        }
      }
      if (type == 'websocket') {
        if (data.location.occupied) {
          this.status = true;
          this.toggleStatusMessages();
        } else {
          $scope.status = false;
          this.toggleStatusMessages();
        }
      }
    };

    this.toggleStatusMessages = () => {
      if (this.status) {
        $scope.statusMsg = 'Occupied';
        toastr.error('Is now occupied!', $scope.locationName, {
          iconClass: 'p-toastr-error p-toastr'
        });
      } else {
        $scope.statusMsg = 'Free';
        toastr.success('Is now free!', $scope.locationName, {
          iconClass: 'p-toastr-success p-toastr'
        });
      }
    }

    // get status from API
    this.getStatus = () => {
      let call_data = {
        suffix: '/locations/2',
        headers: {
          'content-type': 'application/json'
        }
      };

      DataService.getData(call_data).then((data) => {
        let type = 'api';
        this.determineStatus(data, type);
        let average = Math.round((data.data.average_duration / 60));
        $scope.averageTime = average;

      }).catch((response) => {
        $log.log(response);
      });
    };

    // trigger so we get data when the page loads, not just when it changes
    this.getStatus();


    // graph
    $scope.labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    $scope.series = ['Recent visits'];
    $scope.data = [
      [0, 0, 0, 0, 0, 0, 0]
    ];

    this.fillGraph = (data) => {
      angular.forEach(data.data, (val) => {
        let date = new Date(val.start_time);
        let dayNr = date.getDay() -1;
        $scope.data[0][dayNr] = $scope.data[0][dayNr] += 1;
      });
    };

    this.getGraphData = () => {
      let call_data = {
        suffix: '/visits',
        headers: {
          'content-type': 'application/json'
        }
      };

      $scope.dates = [];

      DataService.getData(call_data).then((data) => {
        $log.log(data);
        this.fillGraph(data);

      }).catch((response) => {
        $log.log(response);
      });
    };

    $scope.onClick = function (points, evt) {
      $log.log(points, evt);
    };

    this.getGraphData();

  }
}
